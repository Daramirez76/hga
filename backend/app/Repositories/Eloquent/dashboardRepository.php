<?php

namespace App\Repositories\Eloquent;

use App\Models\actividades;
use App\Models\citas;
use App\Models\informes;
use App\Models\medicamentos;
use App\Models\residentes;
use App\Models\visitas;
use App\Repositories\Interfaces\dashboardInterface;
use Illuminate\Support\Collection;

class dashboardRepository implements dashboardInterface
{
    /**
     * @return array<string, Collection>
     */
    public function getDashboardCollections(): array
    {
        return [
            'residentes' => residentes::query()
                ->get(['cod_residente', 'cod_usuario']),
            'medicamentos' => medicamentos::query()
                ->get(['Cod_medicamento', 'cod_usuario', 'fecha_entrada', 'fecha_novedad']),
            'actividades' => actividades::query()
                ->get(['Cod_acti_ludi', 'Fecha', 'cod_residente']),
            'citas' => citas::query()
                ->get(['cod_cita', 'Fecha_cita', 'cod_Residente']),
            'visitas' => visitas::query()
                ->get(['id', 'cod_Visitas', 'doc_id', 'cod_usuario', 'Fecha_Visita']),
            'informes' => informes::query()
                ->get(['cod_Informes', 'doc_id', 'cod_Residente']),
        ];
    }
}
