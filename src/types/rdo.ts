export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  salario: number;
}

export interface RDO {
  id: string;
  funcionario: string;
  data: string;
  horas: number;
  extras: number;
  noturno: number;
}
