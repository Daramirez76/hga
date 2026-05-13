<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('medicamentos') || Schema::hasTable('medicamento')) {
            return;
        }

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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicamentos');
    }
};
