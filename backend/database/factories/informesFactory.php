<?php

namespace Database\Factories;

use App\Models\informes;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<informes>
 */
class informesFactory extends Factory
{
    protected $model = informes::class;

    public function definition(): array
    {
        static $nextCode = 1;

        return [
            'cod_Informes' => $nextCode++,
            'doc_id' => $this->faker->numberBetween(100000, 99999999),
            'cod_Residente' => $this->faker->numberBetween(1, 25),
            'Titulo_Informes' => mb_substr($this->faker->sentence(6), 0, 255),
            'descripcion' => mb_substr($this->faker->paragraph(), 0, 500),
            'tipo' => $this->faker->randomElement(['general', 'seguimiento', 'medico', 'incidente']),
            'urgencia' => $this->faker->randomElement(['baja', 'normal', 'alta']),
            'cod_rol' => $this->faker->numberBetween(1, 4),
        ];
    }
}
