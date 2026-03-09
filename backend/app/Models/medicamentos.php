<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class medicamentos extends Model
{
      protected $table = 'medicamentos';

    protected $fillable = [
        'cod_medicamento',
        'nombre_medic',
        'fecha_entrada',
        'fecha_vencimiento',
        'cod_usuario',
        'cod_residente',
        'descrip_novedad',
        'fecha_novedad',
        'stock',
    ];
}       

