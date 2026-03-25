<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class citas extends Model
{
    protected $table = 'citas';
    protected $primaryKey = 'cod_cita';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = [
        'cod_cita',
        'Fecha_cita',
        'hora_inicio',
        'hora_fin',
        'Nombre_acompañante',
        'Lugar_cita',
        'cod_Residente'
    ];
}
