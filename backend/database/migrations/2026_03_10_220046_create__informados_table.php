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
        Schema::create('_informados', function (Blueprint $table) {
            $table->id();
            $table->integer('cod_Informes')->unique();
            $table->integer('doc_id')->nullable();
            $table->integer('cod_Residente')->nullable();
            $table->string('Titulo_Informes');
            $table->integer('cod_rol')->nullable();
            $table->string('descripcion')->nullable();
            $table->string('tipo')->nullable();
            $table->string('urgencia')->default('normal');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('_informados');
    }
};
