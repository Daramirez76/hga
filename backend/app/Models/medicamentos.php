<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class medicamentos extends Model
{
    use HasFactory;

    protected $table = 'medicamentos';
    protected $primaryKey = 'Cod_medicamento';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'cod_medicamento',
        'nombre_medic',
        'fecha_entrada',
        'fecha_vencimiento',
        'cod_usuario',
        'cod_residente',
        'cod_rol',
        'descrip_novedad',
        'fecha_novedad',
        'stock',
    ];
}       
