'use server';

import { Suspense } from 'react';
import { getDistributionList } from './actions';
import DistributionClient from './client';

export default async function DistributionPage() {
    const { data } = await getDistributionList();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Distribuição de Leads</h2>
            </div>

            <Suspense fallback={<div>Carregando...</div>}>
                <DistributionClient initialData={data || []} />
            </Suspense>
        </div>
    );
}
