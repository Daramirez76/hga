<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class actividades extends Model
{
     protected $table = '_actividades';
     
    protected $fillable = [
  'Cod_acti_ludi',
  'doc_id',
  'Nombre',
  'Fecha',
  'Hora_ini',
  'Hora_fin',
  'cod_residente',
  'cod_rol',
  'Lugar',
    ];
}


