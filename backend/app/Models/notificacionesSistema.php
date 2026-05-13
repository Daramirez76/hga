<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class notificacionesSistema extends Model
{
    use HasFactory;

    protected $table = 'notificaciones_sistema';

    protected $fillable = [
        'recipient_doc_id',
        'actor_doc_id',
        'module',
        'event',
        'entity_id',
        'cod_residente',
        'title',
        'message',
        'read_at',
        'meta',
    ];

    protected $casts = [
        'id' => 'integer',
        'recipient_doc_id' => 'integer',
        'actor_doc_id' => 'integer',
        'entity_id' => 'integer',
        'cod_residente' => 'integer',
        'read_at' => 'datetime',
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
