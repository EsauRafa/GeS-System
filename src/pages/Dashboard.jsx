import React, { useState, useEffect } from 'react';
import { rdoApi } from '../api/rdoApi';
import { FileText, Building2, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const [rdos, setRdos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rdosData, projetosData, colabsData] = await Promise.all([
          rdoApi.rdos.list(),
          rdoApi.projetos.list(),
          rdoApi.colaboradores.list(),
        ]);
        setRdos(rdosData || []);
        setProjetos(projetosData || []);
        setColaboradores(colabsData || []);
      } catch (error) {
        console.error('Erro carregando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  const rdosThisMonth = rdos.length;
  const projetosAtivos = projetos.filter((p) => p.status === 'ativo').length;
  const colaboradoresAtivos = colaboradores.filter((c) => c.status === 'ativo').length;
  const totalHoras = rdos.reduce(
    (sum, rdo) => sum + (rdo.total_horas_normais || 0) + (rdo.total_horas_extras || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard RDO</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 border-0">
            <div className="flex items-center mb-2">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">RDOs este Mês</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{rdosThisMonth}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 border-0">
            <div className="flex items-center mb-2">
              <Building2 className="h-8 w-8 text-emerald-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Projetos Ativos</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{projetosAtivos}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 border-0">
            <div className="flex items-center mb-2">
              <Users className="h-8 w-8 text-purple-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Funcionários</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{colaboradoresAtivos}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 border-0">
            <div className="flex items-center mb-2">
              <Clock className="h-8 w-8 text-orange-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Horas Totais</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalHoras}h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
