<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class residentes extends Model
{
    use HasFactory;

    protected $table = 'residentes';
    protected $fillable = ['cod_residente', 'nombre', 'apellido', 'edad', 'patologia', 'RH', 'cod_usuario', 'cod_rol'];
}
