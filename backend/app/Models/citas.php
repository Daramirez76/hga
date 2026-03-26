<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class citas extends Model
{
    use HasFactory;

    protected $table = 'citas';
    protected $primaryKey = 'cod_cita';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;
    protected $fillable = [
        'cod_cita',
        'Fecha_cita',
        'hora_inicio',
        'hora_fin',
        'Nombre_acompañante',
        'Lugar_cita',
        'cod_Residente',
        'cod_usuario',
    ];

    protected $casts = [
        'cod_cita' => 'integer',
        'cod_Residente' => 'integer',
        'cod_usuario' => 'integer',
    ];
}
