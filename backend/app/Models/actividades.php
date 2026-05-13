<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class actividades extends Model
{
    use HasFactory;

    protected $table = 'actividades_ludicas';
    protected $primaryKey = 'Cod_acti_ludi';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'Cod_acti_ludi',
        'Nombre',
        'Fecha',
        'Hora_ini',
        'Hora_fin',
        'cod_residente',
        'cod_rol',
        'Lugar',
    ];

    protected $casts = [
        'Cod_acti_ludi' => 'integer',
        'Fecha' => 'date',
        'cod_residente' => 'integer',
        'cod_rol' => 'integer',
    ];
}
