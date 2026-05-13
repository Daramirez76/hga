<?php

namespace Database\Factories;

use App\Models\medicamentos;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<medicamentos>
 */
class medicamentosFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = medicamentos::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $medicamentosNombres = [
            'Losartan',
            'Metformina',
            'Amlodipina',
            'Omeprazol',
            'Paracetam',
            'Ibuprofeno',
            'Donepezilo',
            'Memantina',
            'Fluoxetina',
            'Ampicilina',
        ];

        $fechaEntrada = $this->faker->dateTimeBetween('-6 months', 'now');
        $fechaVencimiento = $this->faker->dateTimeBetween($fechaEntrada, '+2 years');

        return [
            'Cod_medicamento' => $this->faker->unique()->numberBetween(10000, 99999),
            'nombre_medic' => $this->faker->randomElement($medicamentosNombres),
            'fecha_entrada' => $fechaEntrada,
            'fecha_vencimiento' => $fechaVencimiento,
            'cod_usuario' => $this->faker->numberBetween(1000000, 99999999),
            'cod_residente' => $this->faker->numberBetween(1000, 99999),
            'cod_rol' => $this->faker->numberBetween(1, 4),
            'descrip_novedad' => $this->faker->optional()->text(80),
            'fecha_novedad' => $this->faker->optional()->dateTimeThisYear(),
            'stock' => $this->faker->numberBetween(5, 500),
        ];
    }

    /**
     * State for expired medications.
     */
    public function expired(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'fecha_vencimiento' => $this->faker->dateTimeBetween('-1 year', 'now'),
            ];
        });
    }

    /**
     * State for low-stock medications.
     */
    public function lowStock(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'stock' => $this->faker->numberBetween(1, 10),
            ];
        });
    }

    /**
     * State for recently added medications.
     */
    public function recent(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'fecha_entrada' => $this->faker->dateTimeBetween('-7 days', 'now'),
            ];
        });
    }
}
