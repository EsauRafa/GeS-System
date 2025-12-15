let funcionarios = [
  { id: 1, nome: 'João Silva', cargo: 'Engenheiro', status: 'ativo' },
  { id: 2, nome: 'Maria Santos', cargo: 'Técnica', status: 'ativo' },
];

export const funcionariosApi = {
  list: () => Promise.resolve(funcionarios),
  create: (funcionario) => {
    funcionario.id = funcionarios.length + 1;
    funcionarios.push(funcionario);
    return Promise.resolve(funcionario);
  },
  delete: (id) => {
    funcionarios = funcionarios.filter((f) => f.id !== id);
    return Promise.resolve(true);
  },
};
