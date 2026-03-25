<?php

namespace App\Providers;

use App\Repositories\Eloquent\usuariosRepository;
use App\Repositories\Eloquent\actividadesRepository;
use App\Repositories\Eloquent\citasRepository;
use App\Repositories\Eloquent\informesRepository;
use App\Repositories\Eloquent\medicamentosRepository;
use App\Repositories\Eloquent\residentesRepository;
use App\Repositories\Eloquent\visitasRepository;
use App\Repositories\Interfaces\actividadesInterface;
use App\Repositories\Interfaces\citasInterface;
use App\Repositories\Interfaces\informesInterface;
use App\Repositories\Interfaces\medicamentosInterface;
use App\Repositories\Interfaces\usuariosInterface;
use App\Repositories\Interfaces\residentesInterface;
use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(usuariosInterface::class, usuariosRepository::class);
        $this->app->bind(residentesInterface::class, residentesRepository::class);
        $this->app->bind(medicamentosInterface::class, medicamentosRepository::class);
        $this->app->bind(actividadesInterface::class, actividadesRepository::class);
        $this->app->bind(citasInterface::class, citasRepository::class);
        $this->app->bind(informesInterface::class, informesRepository::class);
        $this->app->bind(visitasInterface::class, visitasRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
