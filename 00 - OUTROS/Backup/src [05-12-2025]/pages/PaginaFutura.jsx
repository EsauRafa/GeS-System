import React from 'react';

export default function PaginaFutura() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl shadow-xl p-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Em Desenvolvimento
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Esta funcionalidade está sendo desenvolvida e em breve estará disponível!
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Em Progresso</h3>
            <p className="text-sm text-gray-600">Planejado e em desenvolvimento</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Em Breve</h3>
            <p className="text-sm text-gray-600">Lançamento previsto em breve</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Sugestões?</h3>
            <p className="text-sm text-gray-600">Fale conosco sobre novas ideias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
