<?php

namespace App\Providers;

use App\Repositories\Eloquent\usuariosRepository;
use App\Repositories\Eloquent\residentesRepository;
use App\Repositories\Interfaces\usuariosInterface;
use App\Repositories\Interfaces\residentesInterface;
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
