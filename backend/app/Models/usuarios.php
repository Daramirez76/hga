<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class usuarios extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'usuario';

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'doc_id';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tipo_doc',
        'doc_id',
        'nombre',
        'apellido',
        'edad',
        'direccion',
        'telefono',
        'email',
        'usuario',
        'contraseña',
        'cod_rol',
        'parentesco',
        // Aliases used by the current backend contracts.
        'name',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'contraseña',
        'remember_token',
    ];

    /**
     * Legacy alias for API responses.
     */
    public function getIdAttribute(): int
    {
        return (int) $this->attributes['doc_id'];
    }

    /**
     * Legacy alias for API responses.
     */
    public function getNameAttribute(): string
    {
        return (string) ($this->attributes['nombre'] ?? '');
    }

    /**
     * Legacy alias for auth flows.
     */
    public function getPasswordAttribute(): string
    {
        return (string) ($this->attributes['contraseña'] ?? '');
    }

    /**
     * Allow assigning "name" while storing "nombre".
     *
     * @param string $value
     */
    public function setNameAttribute(string $value): void
    {
        $this->attributes['nombre'] = $value;
    }

    /**
     * Allow assigning "password" while storing "contraseña".
     *
     * @param string $value
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['contraseña'] = $value;
    }

    /**
     * Auth must read from "contraseña" in table "usuario".
     */
    public function getAuthPassword(): string
    {
        return (string) ($this->attributes['contraseña'] ?? '');
    }

    /**
     * @return int
     */
    public function getJWTIdentifier(): int
    {
        return (int) $this->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
