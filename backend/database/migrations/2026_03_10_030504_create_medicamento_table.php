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
        Schema::create('medicamento', function (Blueprint $table) {
            $table->id();
            $table->integer('cod_medicamento')->unique();
            $table->string('nombre_medic', 255);
            $table->date('fecha_entrada');
            $table->date('fecha_vencimiento');
            $table->integer('cod_usuario')->nullable();
            $table->integer('cod_residente')->nullable();
            $table->integer('cod_rol')->nullable();
            $table->string('descrip_novedad', 500)->nullable();
            $table->date('fecha_novedad')->nullable();
            $table->integer('stock');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicamento');
    }
};
