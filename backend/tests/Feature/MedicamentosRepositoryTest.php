<?php

namespace Tests\Feature;

use App\Repositories\Eloquent\medicamentosRepository;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MedicamentosRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('medicamentos');

        Schema::create('medicamentos', function (Blueprint $table) {
            $table->integer('Cod_medicamento')->primary();
            $table->string('nombre_medic', 10);
            $table->date('fecha_entrada');
            $table->date('fecha_vencimiento');
            $table->integer('cod_usuario');
            $table->integer('cod_residente');
            $table->integer('cod_rol');
            $table->string('descrip_novedad', 100)->nullable();
            $table->date('fecha_novedad')->nullable();
            $table->integer('stock');
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('medicamentos');

        parent::tearDown();
    }

    public function test_create_generates_next_available_code_when_missing(): void
    {
        $repository = new medicamentosRepository();

        $repository->create([
            'Cod_medicamento' => 7,
            'nombre_medic' => 'Aspirina',
            'fecha_entrada' => '2026-03-01',
            'fecha_vencimiento' => '2026-06-01',
            'cod_usuario' => 1,
            'cod_residente' => 1,
            'cod_rol' => 1,
            'descrip_novedad' => 'Ingreso',
            'fecha_novedad' => '2026-03-01',
            'stock' => 10,
        ]);

        $created = $repository->create([
            'nombre_medic' => 'Paracet',
            'fecha_entrada' => '2026-03-02',
            'fecha_vencimiento' => '2026-06-02',
            'cod_usuario' => 2,
            'cod_residente' => 2,
            'cod_rol' => 2,
            'descrip_novedad' => 'Nuevo',
            'fecha_novedad' => '2026-03-02',
            'stock' => 5,
        ]);

        $this->assertSame(8, $created->Cod_medicamento);
    }

    public function test_create_preserves_explicit_code(): void
    {
        $repository = new medicamentosRepository();

        $created = $repository->create([
            'Cod_medicamento' => 99,
            'nombre_medic' => 'Ibupro',
            'fecha_entrada' => '2026-03-03',
            'fecha_vencimiento' => '2026-06-03',
            'cod_usuario' => 3,
            'cod_residente' => 3,
            'cod_rol' => 3,
            'descrip_novedad' => 'Manual',
            'fecha_novedad' => '2026-03-03',
            'stock' => 12,
        ]);

        $this->assertSame(99, $created->Cod_medicamento);
    }
}
