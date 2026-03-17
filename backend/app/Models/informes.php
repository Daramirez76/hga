<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class informes extends Model
{
    protected $table = '_informados';
    
    protected $fillable = [
        'cod_Informes',
        'doc_id',
        'cod_Residente',
        'Titulo_Informes',
        'cod_rol',
        'descripcion',
        'tipo',
        'urgencia'
    ];
}
