<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class actividades extends Model
{
    protected $table = 'actividades_ludicas';
    protected $primaryKey = 'Cod_acti_ludi';
    public $incrementing = false;
    public $timestamps = false;
     
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

