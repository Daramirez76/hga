<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class residentes extends Model
{
    use HasFactory;

    protected $table = 'residente';
    protected $primaryKey = 'cod_residente';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = ['cod_residente', 'nombre', 'apellido', 'edad', 'patologia', 'RH', 'cod_usuario', 'cod_rol'];
}
