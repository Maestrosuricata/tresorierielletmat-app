// CONFIGURATION — Clés Supabase de Tresorierielletmat
const SUPABASE_URL = "https://vifwgxukckjmnvpvsaab.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_olO4qtgdXaV9XPXECIkcTA_cngX3bN0";

// Importe la lib Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RECETTES
async function addRecette(data) {
  const { error } = await supabase
    .from('recettes')
    .insert([{
      date: data.date,
      payeur: data.payeur,
      source: data.source,
      destination: data.destination,
      montant: parseFloat(data.montant),
      mode: data.mode,
      statut: data.statut,
      ch_banque: data.ch_banque || null,
      ch_num: data.ch_num || null,
      notes: data.notes || null
    }]);
  
  if (error) {
    console.error('Erreur recette:', error);
    return false;
  }
  console.log('Recette ajoutée ✓');
  return true;
}

// DÉPENSES
async function addDepense(data) {
  const { error } = await supabase
    .from('depenses')
    .insert([{
      date: data.date,
      creancier: data.creancier,
      categorie: data.categorie,
      payeur: data.payeur,
      montant: parseFloat(data.montant),
      mode: data.mode,
      statut: data.statut,
      piece: data.piece || null,
      notes: data.notes || null
    }]);
  
  if (error) {
    console.error('Erreur dépense:', error);
    return false;
  }
  console.log('Dépense ajoutée ✓');
  return true;
}

// ADHÉSIONS
async function addAdhesion(data) {
  const { error } = await supabase
    .from('adhesions')
    .insert([{
      section: data.section,
      categorie: data.categorie,
      montant: parseFloat(data.montant),
      mode: data.mode,
      date: data.date,
      statut: data.statut,
      licence: data.licence,
      maman_de_joueur: data.maman_de_joueur === 'Oui',
      ch_banque: data.ch_banque || null,
      ch_num: data.ch_num || null,
      notes: data.notes || null
    }]);
  
  if (error) {
    console.error('Erreur adhésion:', error);
    return false;
  }
  console.log('Adhésion ajoutée ✓');
  return true;
}

// RÉCUPÉRER LES RECETTES
async function getRecettes() {
  const { data, error } = await supabase
    .from('recettes')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Erreur lecture recettes:', error);
    return [];
  }
  return data;
}

// RÉCUPÉRER LES DÉPENSES
async function getDepenses() {
  const { data, error } = await supabase
    .from('depenses')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Erreur lecture dépenses:', error);
    return [];
  }
  return data;
}

// RÉCUPÉRER LES ADHÉSIONS
async function getAdhesions() {
  const { data, error } = await supabase
    .from('adhesions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Erreur lecture adhésions:', error);
    return [];
  }
  return data;
}

export { addRecette, addDepense, addAdhesion, getRecettes, getDepenses, getAdhesions };
