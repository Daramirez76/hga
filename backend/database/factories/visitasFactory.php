<?php

namespace Database\Factories;

use App\Models\residentes;
use App\Models\usuarios;
use App\Models\visitas;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<visitas>
 */
class visitasFactory extends Factory
{
    protected $model = visitas::class;

    public function definition(): array
    {
        static $nextCode = null;

        if ($nextCode === null) {
            $nextCode = ((int) visitas::query()->max('cod_Visitas')) + 1;
        }

        $residentCode = residentes::query()->value('cod_residente');
        $userCode = usuarios::query()->value('doc_id');

        return [
            'cod_Visitas' => $nextCode++,
            'doc_id' => $this->faker->unique()->numberBetween(1000000, 99999999),
            'Nomb_visitante' => mb_substr($this->faker->name(), 0, 50),
            'cod_Residente' => $residentCode ? (int) $residentCode : $this->faker->numberBetween(1, 99999),
            'Fecha_Visita' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'cod_usuario' => $userCode ? (int) $userCode : $this->faker->numberBetween(1000000, 99999999),
        ];
    }
}
