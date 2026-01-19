// rdoApi uses browser localStorage directly

let rdos = [];
let projetos = [];
let colaboradores = [];

export const rdoApi = {
  rdos: {
    list: () => Promise.resolve(rdos),
    create: (data) => {
      data.id = Date.now();
      rdos.unshift(data); // Novo primeiro
      return Promise.resolve(data);
    }
  },
  projetos: {
    list: () => Promise.resolve(projetos),
    create: (data) => {
      data.id = Date.now();
      projetos.unshift(data);
      return Promise.resolve(data);
    }
  },
  colaboradores: {
    list: () => Promise.resolve(colaboradores),
    create: (data) => {
      data.id = Date.now();
      colaboradores.unshift(data);
      return Promise.resolve(data);
    },
    delete: (id) => {
      colaboradores = colaboradores.filter(c => c.id !== id);
      return Promise.resolve(true);
    }
  }
};

// Carregar dados salvos
const loadData = () => {
  const savedRdos = localStorage.getItem('rdos');
  const savedProjetos = localStorage.getItem('projetos');
  const savedColabs = localStorage.getItem('colaboradores');
  
  if (savedRdos) rdos = JSON.parse(savedRdos);
  if (savedProjetos) projetos = JSON.parse(savedProjetos);
  if (savedColabs) colaboradores = JSON.parse(savedColabs);
};

// Salvar dados
const saveData = () => {
  localStorage.setItem('rdos', JSON.stringify(rdos));
  localStorage.setItem('projetos', JSON.stringify(projetos));
  localStorage.setItem('colaboradores', JSON.stringify(colaboradores));
};

// Auto-save a cada mudança
const originalPushRdo = rdoApi.rdos.create;
rdoApi.rdos.create = (data) => originalPushRdo(data).then(saveData);

const originalPushProj = rdoApi.projetos.create;
rdoApi.projetos.create = (data) => originalPushProj(data).then(saveData);

const originalPushColab = rdoApi.colaboradores.create;
rdoApi.colaboradores.create = (data) => originalPushColab(data).then(saveData);

const originalDeleteColab = rdoApi.colaboradores.delete;
rdoApi.colaboradores.delete = (id) => originalDeleteColab(id).then(saveData);

// Carregar ao iniciar
loadData();
