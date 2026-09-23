// ia.js — pré-remplissage des formulaires à partir d'une photo (chèque, facture, ticket)
// Nécessite la fonction Supabase "lire-document". Se greffe automatiquement sur index.html.
(function () {
  var FONCTION = 'lire-document';

  // Correspondance : champ renvoyé par l'IA -> champ du formulaire
  var MAP = {
    rec: { date: 'rec-date', montant: 'rec-montant', emetteur: 'rec-payeur', banque: 'rec-banque', numero_cheque: 'rec-num', mode: 'rec-mode', description: 'rec-notes' },
    dep: { date: 'dep-date', montant: 'dep-montant', emetteur: 'dep-creancier', numero_piece: 'dep-piece', mode: 'dep-mode', description: 'dep-notes' },
    // Adhésions : le titulaire du chèque est souvent un parent, donc il va dans Notes, pas dans le nom de l'adhérent
    adh: { date: 'adh-date', montant: 'adh-montant', emetteur: 'adh-notes', banque: 'adh-banque', numero_cheque: 'adh-num', mode: 'adh-mode' }
  };

  var css = '.ia-box{background:#fff8e1;border:1px dashed #e0a800;border-radius:8px;padding:12px;margin-bottom:16px}'
    + '.ia-box label.ia-btn{display:inline-block;cursor:pointer;background:#c98f00;color:#fff;padding:9px 14px;border-radius:6px;font-weight:bold;margin:0}'
    + '.ia-box input[type=file]{display:none}'
    + '.ia-box .ia-msg{display:block;margin-top:8px;font-size:13px}'
    + '.ia-fill{background:#fff3b0 !important;border-color:#c98f00 !important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  ['rec', 'dep', 'adh'].forEach(function (tab) {
    var form = document.getElementById('f-' + tab);
    if (!form) return;
    var box = document.createElement('div');
    box.className = 'ia-box';
    box.innerHTML = '<label class="ia-btn" for="ia-' + tab + '">📷 Photo du document → pré-remplir</label>'
      + '<input type="file" id="ia-' + tab + '" accept="image/*">'
      + '<span class="ia-msg" id="ia-msg-' + tab + '">Chèque, facture ou ticket. Les champs remplis apparaissent en jaune : vérifiez-les avant d\'ajouter.</span>';
    form.parentNode.insertBefore(box, form);
    document.getElementById('ia-' + tab).addEventListener('change', function () { lire(this, tab); });
    form.addEventListener('reset', function () {
      form.querySelectorAll('.ia-fill').forEach(function (el) { el.classList.remove('ia-fill'); });
    });
  });

  function reduire(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600;
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = function () { reject(new Error('Image illisible par le navigateur (format HEIC ?)')); };
      img.src = url;
    });
  }

  function remplirChamp(id, v) {
    if (v === null || v === undefined || v === '') return false;
    var el = document.getElementById(id);
    if (!el) return false;
    if (el.tagName === 'SELECT') {
      for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].text.toLowerCase() === String(v).toLowerCase()) {
          el.selectedIndex = i;
          el.classList.add('ia-fill');
          return true;
        }
      }
      return false;
    }
    if (el.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return false;
    if (el.type === 'number' && isNaN(parseFloat(v))) return false;
    if (id === 'adh-notes') v = 'Titulaire du chèque : ' + v;
    el.value = String(v);
    el.classList.add('ia-fill');
    return true;
  }

  async function lire(input, tab) {
    var file = input.files[0];
    if (!file) return;
    var msg = document.getElementById('ia-msg-' + tab);
    msg.style.color = '#555';
    msg.textContent = 'Lecture en cours… (5 à 15 secondes)';
    try {
      var b64 = await reduire(file);
      var r = await fetch(window.SUPABASE_URL + '/functions/v1/' + FONCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_KEY },
        body: JSON.stringify({ image: b64, media_type: 'image/jpeg' })
      });
      var d = await r.json().catch(function () { return { error: 'Réponse invalide (HTTP ' + r.status + ')' }; });
      if (!r.ok || d.error) throw new Error(d.error || ('HTTP ' + r.status));
      var n = 0, map = MAP[tab];
      Object.keys(map).forEach(function (k) { if (remplirChamp(map[k], d[k])) n++; });
      if (d.type === 'cheque' && remplirChamp(map.mode, 'Chèque')) n++;
      msg.style.color = n ? '#155724' : '#721c24';
      msg.textContent = n
        ? n + ' champ(s) pré-rempli(s) en jaune. VÉRIFIEZ-les, complétez le reste, puis cliquez sur Ajouter.'
        : 'Aucune information lisible. Reprenez la photo : bien à plat, éclairée, sans reflet.';
    } catch (e) {
      msg.style.color = '#721c24';
      msg.textContent = 'Erreur : ' + e.message;
    }
    input.value = '';
  }
})();
