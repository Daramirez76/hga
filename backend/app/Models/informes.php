<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class informes extends Model
{
    use HasFactory;

    protected $table = 'informes';
    protected $primaryKey = 'cod_Informes';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'cod_Informes',
        'doc_id',
        'cod_Residente',
        'Titulo_Informes',
        'cod_rol',
        'descripcion',
        'tipo',
        'urgencia',
    ];

    protected $casts = [
        'cod_Informes' => 'integer',
        'doc_id' => 'integer',
        'cod_Residente' => 'integer',
        'cod_rol' => 'integer',
    ];
}
