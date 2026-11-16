 // CONEXÃO SUPABASE
const SUPABASE_URL = 'https://qjippsnmszhpsnfddwhi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__797yt1Ud0ihbHmuZuaT8w_X2xevNyN';
let supabaseClient;
try { supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){}

// CARREGA TUDO
async function carregarDashboard(){
  await listarProjetosAdmin();
  await listarMensagens();
  await atualizarContadores();
}

async function atualizarContadores(){
  let totalProj = JSON.parse(localStorage.getItem('meus_projetos') || '[]').length;
  let totalMsgs = JSON.parse(localStorage.getItem('meus_leads') || '[]').length;
  if(supabaseClient){
    try {
      const p = await supabaseClient.from('projetos').select('*', {count:'exact', head:true});
      if(p.count) totalProj = Math.max(totalProj, p.count);
      const l = await supabaseClient.from('leads').select('*', {count:'exact', head:true});
      if(l.count) totalMsgs = Math.max(totalMsgs, l.count);
    } catch(e){}
  }
  const elProj = document.getElementById('total-projetos');
  const elMsgs = document.getElementById('total-mensagens');
  if(elProj) elProj.textContent = totalProj;
  if(elMsgs) elMsgs.textContent = totalMsgs;
}

// SALVAR OU ATUALIZAR
async function salvarProjeto(e){
  e.preventDefault();
  const titulo = document.getElementById('projeto-titulo')?.value.trim();
  const categoria = document.getElementById('projeto-categoria')?.value.trim() || 'Portfólio';
  const link = document.getElementById('projeto-url')?.value.trim();
  const descricao = document.getElementById('projeto-desc')?.value.trim();
  const imagem = document.getElementById('projeto-imagem')?.value.trim() || '';

  if(!titulo || !descricao){ alert('Preencha título e descrição!'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  const editandoId = btn?.dataset.editandoId;
  let listaLocal = JSON.parse(localStorage.getItem('meus_projetos') || '[]');

  if(editandoId){
    listaLocal = listaLocal.map(p => String(p.id) === String(editandoId) ? {...p, titulo, categoria, link, descricao, imagem} : p);
    localStorage.setItem('meus_projetos', JSON.stringify(listaLocal));
    if(supabaseClient){ try { await supabaseClient.from('projetos').update({titulo, categoria, link, descricao, imagem}).eq('id', editandoId); } catch(err){} }
    alert('Projeto atualizado com sucesso!');
    btn.innerHTML = 'Publicar projeto';
    delete btn.dataset.editandoId;
    const t = document.getElementById('titulo-form-projeto');
    if(t) t.innerHTML = '<i class="fa-solid fa-plus" style="color:#7540ad"></i> Cadastrar novo projeto';
    const c = document.getElementById('btn-cancelar-edicao');
    if(c) c.style.display='none';
  } else {
    const novoProjeto = { id: Date.now().toString(), titulo, descricao, categoria, imagem, link, created_at: new Date().toISOString() };
    listaLocal.unshift(novoProjeto);
    localStorage.setItem('meus_projetos', JSON.stringify(listaLocal));
    if(supabaseClient){ try { await supabaseClient.from('projetos').insert([{titulo, descricao, categoria, imagem, link}]); } catch(err){} }
    alert('Projeto publicado com sucesso!');
  }
  e.target.reset();
  carregarDashboard();
}

// EDITAR - CORRIGIDO PRA BUSCAR NO SUPABASE
async function editarProjeto(id){
  let projetos = JSON.parse(localStorage.getItem('meus_projetos') || '[]');
  let projeto = projetos.find(p => String(p.id) === String(id));
  
  if(!projeto && supabaseClient){
    try {
      const { data } = await supabaseClient.from('projetos').select('*').eq('id', id).single();
      if(data) projeto = data;
      else {
        const { data: todos } = await supabaseClient.from('projetos').select('*');
        if(todos) projeto = todos.find(p=> String(p.id) === String(id));
      }
    } catch(e){ console.log(e); }
  }
  
  if(!projeto){ alert('Projeto não encontrado! ID: '+id); return; }
  
  document.getElementById('projeto-titulo').value = projeto.titulo || '';
  document.getElementById('projeto-categoria').value = projeto.categoria || '';
  document.getElementById('projeto-url').value = projeto.link || '';
  document.getElementById('projeto-desc').value = projeto.descricao || '';
  if(document.getElementById('projeto-imagem')) document.getElementById('projeto-imagem').value = projeto.imagem || '';
  
  const btn = document.querySelector('#form-projeto button[type="submit"]');
  if(btn){
    btn.innerHTML = 'Atualizar projeto';
    btn.dataset.editandoId = projeto.id;
  }
  const tituloForm = document.getElementById('titulo-form-projeto');
  if(tituloForm) tituloForm.innerHTML = 'Editando: ' + projeto.titulo;
  const btnCancel = document.getElementById('btn-cancelar-edicao');
  if(btnCancel) btnCancel.style.display='block';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function cancelarEdicao(){
  document.getElementById('form-projeto')?.reset();
  const btn = document.querySelector('#form-projeto button[type="submit"]');
  if(btn){ btn.innerHTML='Publicar projeto'; delete btn.dataset.editandoId; }
  const t = document.getElementById('titulo-form-projeto');
  if(t) t.innerHTML='<i class="fa-solid fa-plus" style="color:#7540ad"></i> Cadastrar novo projeto';
  const c = document.getElementById('btn-cancelar-edicao');
  if(c) c.style.display='none';
}

// LISTAR ADMIN
async function listarProjetosAdmin(){
  const container = document.getElementById('lista-projetos-admin');
  if(!container) return;
  let projetos = JSON.parse(localStorage.getItem('meus_projetos') || '[]');
  if(supabaseClient){
    try {
      const { data } = await supabaseClient.from('projetos').select('*').order('created_at', {ascending:false});
      if(data && data.length>0){
        projetos = data;
        localStorage.setItem('meus_projetos', JSON.stringify(data.map(p=> ({...p, id: String(p.id)}))));
      }
    } catch(e){}
  }
  if(projetos.length===0){ container.innerHTML='<small style="color:#9a8fa6">Nenhum projeto ainda.</small>'; return; }
  container.innerHTML='';
  projetos.forEach(p=>{
    container.innerHTML+=`
      <div style="border:1px solid #ece3f6;border-radius:12px;padding:12px;background:#fff;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div style="flex:1"><strong style="font-size:.88rem;display:block">${p.titulo}</strong><span style="font-size:.75rem;color:#7c7586">${p.categoria||'Portfólio'}</span></div>
          <div style="display:flex;gap:6px">
            ${p.link?`<a href="${p.link}" target="_blank" style="padding:6px 10px;border-radius:8px;background:#f3e9fb;color:#7540ad;font-size:.72rem;font-weight:700;text-decoration:none">Ver</a>`:''}
            <button onclick="editarProjeto('${p.id}')" style="padding:6px 10px;border-radius:8px;border:1px solid #e0d2f0;background:#f3e9fb;color:#7540ad;font-size:.72rem;font-weight:700;cursor:pointer">Editar</button>
            <button onclick="deletarProjeto('${p.id}')" style="padding:6px 10px;border-radius:8px;border:1px solid #ffd6de;background:#fff1f2;color:#b91c3a;font-size:.72rem;font-weight:700;cursor:pointer">Excluir</button>
          </div>
        </div>
      </div>
    `;
  });
}

// LISTAR MENSAGENS - SEM BUG AZUL
async function listarMensagens(){
  const container = document.getElementById('lista-mensagens');
  if(!container) return;
  let mensagens = JSON.parse(localStorage.getItem('meus_leads') || '[]');
  if(supabaseClient){
    try {
      const { data } = await supabaseClient.from('leads').select('*').order('created_at', {ascending:false});
      if(data && data.length>0) mensagens = data;
    } catch(e){}
  }
  if(mensagens.length===0){ container.innerHTML='<small style="color:#9a8fa6">Nenhuma mensagem ainda.</small>'; return; }
  container.innerHTML='';
  mensagens.forEach(l=>{
    const dataFormat = l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : 'hoje';
    const msgSafe = (l.mensagem||'').replace(/'/g, " ");
    const nomeSafe = (l.nome||'').replace(/'/g, " ");
    container.innerHTML+=`
      <div style="border:1px solid #ece3f6;border-radius:14px;padding:12px;background:#fff;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between"><strong style="font-size:.88rem">${l.nome}</strong><small style="color:#a99db6">${dataFormat}</small></div>
        <div style="font-size:.78rem;color:#5b5466">${l.email}</div>
        <div style="margin-top:8px;background:#fcf9ff;border-radius:10px;padding:10px;font-size:.85rem"><b>Mensagem escrita:</b><br>${l.mensagem}</div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button onclick="this.textContent='✓ Lido'" style="padding:6px 10px;border-radius:999px;border:1px solid #ece3f6;background:#fff;font-size:.72rem;font-weight:700;cursor:pointer">Marcar como lido</button>
          <button onclick="window.open('https://wa.me/?text='+encodeURIComponent('Olá ${nomeSafe}! Vi sua mensagem: ${msgSafe} - Ana&#32;Clara'),' _blank')" style="padding:6px 10px;border-radius:999px;border:1px solid #bbf7d0;background:#dcfce7;color:#15803d;font-size:.72rem;font-weight:700;cursor:pointer">WhatsApp</button>
          <button onclick="navigator.clipboard.writeText('${l.email}')" style="padding:6px 10px;border-radius:999px;border:1px solid #ece3f6;background:#fff;font-size:.72rem;font-weight:700;cursor:pointer">Copiar e-mail</button>
          <button onclick="deletarLead('${l.id}')" style="padding:6px 10px;border-radius:999px;border:1px solid #ffd6de;background:#fff1f2;color:#b91c3a;font-size:.72rem;font-weight:700;cursor:pointer">Apagar</button>
        </div>
      </div>
    `;
  });
}

// DELETAR
async function deletarProjeto(id){
  if(!confirm('Excluir este projeto?')) return;
  let lista = JSON.parse(localStorage.getItem('meus_projetos')||'[]');
  lista = lista.filter(x=> String(x.id) != String(id));
  localStorage.setItem('meus_projetos', JSON.stringify(lista));
  if(supabaseClient){ try { await supabaseClient.from('projetos').delete().eq('id', id); } catch(e){} }
  carregarDashboard();
}
async function deletarLead(id){
  if(!confirm('Apagar mensagem?')) return;
  let lista = JSON.parse(localStorage.getItem('meus_leads')||'[]');
  lista = lista.filter(x=> String(x.id) != String(id));
  localStorage.setItem('meus_leads', JSON.stringify(lista));
  if(supabaseClient){ try { await supabaseClient.from('leads').delete().eq('id', id); } catch(e){} }
  carregarDashboard();
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('lista-projetos-admin') || document.getElementById('lista-mensagens')) carregarDashboard();
});