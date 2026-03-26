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
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'Cod_medicamento',
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

    protected $casts = [
        'Cod_medicamento' => 'integer',
        'cod_medicamento' => 'integer',
        'cod_usuario' => 'integer',
        'cod_residente' => 'integer',
        'cod_rol' => 'integer',
        'stock' => 'integer',
    ];
}       
