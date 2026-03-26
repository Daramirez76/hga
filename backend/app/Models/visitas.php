<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class visitas extends Model
{
    use HasFactory;

    protected $table = 'visita';

    protected $fillable = [
        'cod_Visitas',
        'doc_id',
        'Nomb_visitante',
        'cod_Residente',
        'Fecha_Visita',
        'cod_usuario'
    ];

    protected $casts = [
        'id' => 'integer',
        'cod_Visitas' => 'integer',
        'doc_id' => 'integer',
        'cod_Residente' => 'integer',
        'cod_usuario' => 'integer',
        'Fecha_Visita' => 'date:Y-m-d',
    ];
}
