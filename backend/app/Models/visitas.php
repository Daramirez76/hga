<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class visitas extends Model
{
    protected $table = 'visitas';
    protected $fillable = [
        'cod_Visitas',
        'doc_id',
        'Nomb_visitante',
        'cod_Residente',
        'Fecha_Visita',
        'cod_usuario'
    ];
}
