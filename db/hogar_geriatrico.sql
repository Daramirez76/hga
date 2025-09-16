-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-08-2025 a las 05:46:26
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `hogar_geriatrico_`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_agregar_medicamento` (IN `p_nombre_medic` VARCHAR(10), IN `p_fecha_entrada` DATE, IN `p_fecha_vencimiento` DATE, IN `p_cod_usuario` INT, IN `p_cod_residente` INT, IN `p_cod_rol` INT, IN `p_descrip_novedad` VARCHAR(100), IN `p_fecha_novedad` DATE, IN `p_disponibilidad` INT)   BEGIN
    INSERT INTO medicamentos (nombre_medic, fecha_entrada, fecha_vencimiento, cod_usuario, cod_residente, cod_rol, descrip_novedad, fecha_novedad, disponibilidad)
    VALUES (p_nombre_medic, p_fecha_entrada, p_fecha_vencimiento, p_cod_usuario, p_cod_residente, p_cod_rol, p_descrip_novedad, p_fecha_novedad, p_disponibilidad);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_agregar_residente` (IN `p_nombre` VARCHAR(50), IN `p_apellido` VARCHAR(50), IN `p_edad` INT, IN `p_patologia` VARCHAR(120), IN `p_RH` VARCHAR(6), IN `p_cod_usuario` INT, IN `p_cod_rol` INT)   BEGIN
    INSERT INTO residente (nombre, apellido, edad, patologia, RH, cod_usuario, cod_rol)
    VALUES (p_nombre, p_apellido, p_edad, p_patologia, p_RH, p_cod_usuario, p_cod_rol);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_agregar_usuario` (IN `p_tipo_doc` VARCHAR(16), IN `p_doc_id` INT, IN `p_nombre` VARCHAR(100), IN `p_apellido` VARCHAR(100), IN `p_direccion` VARCHAR(150), IN `p_telefono` BIGINT, IN `p_email` VARCHAR(100), IN `p_usuario` VARCHAR(100), IN `p_contraseña` VARCHAR(32), IN `p_cod_rol` INT, IN `p_parentesco` VARCHAR(32))   BEGIN
    INSERT INTO usuario (tipo_doc, doc_id, nombre, apellido, direccion, telefono, email, usuario, contraseña, cod_rol, parentesco)
    VALUES (p_tipo_doc, p_doc_id, p_nombre, p_apellido, p_direccion, p_telefono, p_email, p_usuario, p_contraseña, p_cod_rol, p_parentesco);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividades_ludicas`
--

CREATE TABLE `actividades_ludicas` (
  `Cod_acti_ludi` int(10) NOT NULL,
  `Nombre` varchar(50) NOT NULL,
  `Fecha` date NOT NULL,
  `Hora_ini` time NOT NULL,
  `Hora_fin` time NOT NULL,
  `cod_residente` int(10) NOT NULL,
  `Lugar` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `actividades_ludicas`
--

INSERT INTO `actividades_ludicas` (`Cod_acti_ludi`, `Nombre`, `Fecha`, `Hora_ini`, `Hora_fin`, `cod_residente`, `Lugar`) VALUES
(1, 'Actividad física ', '2025-09-14', '10:00:00', '11:00:00', 5, 'Hogar Geriátrico Años Dorados'),
(2, 'Pintura', '2025-09-10', '09:30:00', '10:20:00', 2, 'Hogar Geriátrico Años Dorados'),
(3, 'Actividad de memoria', '2025-09-11', '15:00:00', '15:45:00', 4, 'Hogar Geriátrico Años Dorados'),
(4, 'Danzas', '2025-09-19', '10:15:00', '11:00:00', 3, 'Hogar Geriátrico Años Dorados'),
(5, 'Fisioterapia', '2025-09-22', '09:00:00', '10:30:00', 1, 'Hogar Geriátrico Años Dorados');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `cod_cita` int(10) NOT NULL,
  `Fecha_cita` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `Nombre_acompañante` varchar(50) NOT NULL,
  `Lugar_cita` varchar(30) NOT NULL,
  `cod_Residente` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`cod_cita`, `Fecha_cita`, `hora_inicio`, `hora_fin`, `Nombre_acompañante`, `Lugar_cita`, `cod_Residente`) VALUES
(1, '2025-09-04', '14:20:00', '14:40:00', 'Maria Guasca', 'Centro Medico ', 3),
(2, '2025-09-09', '08:00:00', '08:25:00', 'Jose Jimenez', 'Clinica Meredy', 2),
(3, '2025-09-16', '11:10:00', '11:30:00', 'Lucila Sanchez', 'Clinica Roma', 5),
(4, '2025-09-24', '10:30:00', '10:50:00', 'Maria Guasca', 'Clinica Meredy', 3),
(5, '2025-10-01', '13:00:00', '13:25:00', 'David Muñoz', 'Hospital Universitario Corpas', 1);

--
-- Disparadores `citas`
--
DELIMITER $$
CREATE TRIGGER `tr_notificacion_cita` AFTER INSERT ON `citas` FOR EACH ROW BEGIN
    INSERT INTO notificaciones (cod_usuario, Cod_rol, cod_Residente, Descrip_Novedad)
   VALUES ( NEW.hora_inicio, NEW.Lugar_cita, NEW.Nombre_acompañante); 
   
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `informes`
--

CREATE TABLE `informes` (
  `cod_Informes` int(10) NOT NULL,
  `doc_id` int(10) NOT NULL,
  `cod_Residente` int(10) NOT NULL,
  `Titulo_Informe` varchar(50) NOT NULL,
  `cod_rol` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `informes`
--

INSERT INTO `informes` (`cod_Informes`, `doc_id`, `cod_Residente`, `Titulo_Informe`, `cod_rol`) VALUES
(1, 123456, 1, 'El residente Alejandro padece de Hipertensión ', 8),
(2, 10012345, 5, 'El residente Andrés tiene el colesterol alto', 8),
(3, 10067890, 2, 'La residente Camila tiene diabetes tipo 2', 8),
(4, 1022937343, 3, 'El residente Sebastián tiene artritis ', 8),
(5, 30098765, 4, 'La residente Valentina padece de asma', 8);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `Cod_inventario` int(10) NOT NULL,
  `Disponibilidad` tinyint(1) NOT NULL,
  `Cod_medicamento` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`Cod_inventario`, `Disponibilidad`, `Cod_medicamento`) VALUES
(1, 1, 4),
(2, 0, 5),
(3, 0, 1),
(4, 1, 2),
(5, 1, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicamentos`
--

CREATE TABLE `medicamentos` (
  `Cod_medicamento` int(10) NOT NULL,
  `nombre_medic` varchar(10) NOT NULL,
  `fecha_entrada` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `cod_usuario` int(10) NOT NULL,
  `cod_residente` int(10) NOT NULL,
  `cod_rol` int(10) NOT NULL,
  `descrip_novedad` varchar(100) NOT NULL,
  `fecha_novedad` date NOT NULL,
  `disponibilidad` int(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medicamentos`
--

INSERT INTO `medicamentos` (`Cod_medicamento`, `nombre_medic`, `fecha_entrada`, `fecha_vencimiento`, `cod_usuario`, `cod_residente`, `cod_rol`, `descrip_novedad`, `fecha_novedad`, `disponibilidad`) VALUES
(1, 'Aspirina', '2025-08-01', '2027-08-01', 30098765, 1, 6, 'Entrega inicial de medicamento', '2025-08-01', 50),
(2, 'Insulina', '2025-07-15', '2026-07-15', 30098765, 2, 6, 'Tratamiento de diabetes tipo 2', '2025-07-16', 30),
(3, 'Paracetam', '2025-06-20', '2027-06-20', 30098765, 3, 6, 'Uso en caso de fiebre y dolor', '2025-06-21', 100),
(4, 'Salbutam', '2025-05-10', '2026-05-10', 30098765, 4, 6, 'Inhalador para control de asma', '2025-05-11', 20),
(5, 'Atorvast', '2025-08-05', '2028-08-05', 30098765, 5, 6, 'Tratamiento para colesterol alto', '2025-08-06', 40);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `cod_Notificaciones` int(10) NOT NULL,
  `cod_usuario` int(10) NOT NULL,
  `Cod_rol` int(10) NOT NULL,
  `cod_Residente` int(10) NOT NULL,
  `Descrip_Novedad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`cod_Notificaciones`, `cod_usuario`, `Cod_rol`, `cod_Residente`, `Descrip_Novedad`) VALUES
(1, 123456, 10, 1, 'El residente de Nombre Alejandro debe de tomarse las\r\nAspirinas todos los días a las 10'),
(2, 10012345, 10, 2, 'El residente de nombre Sebastián tiene reunión el 2025-09-02'),
(3, 10067890, 10, 4, 'El residente de Nombre Valentina tiene una visita cancelada'),
(4, 1022937343, 10, 5, 'El residente de Nombre Andrés tiene una cita médica agendada '),
(5, 30098765, 10, 3, 'El residente de nombre Sebastián tiene una visita Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `residente`
--

CREATE TABLE `residente` (
  `cod_residente` int(10) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `edad` int(3) NOT NULL,
  `patologia` varchar(120) NOT NULL,
  `RH` varchar(6) NOT NULL,
  `cod_usuario` int(10) NOT NULL,
  `cod_rol` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `residente`
--

INSERT INTO `residente` (`cod_residente`, `nombre`, `apellido`, `edad`, `patologia`, `RH`, `cod_usuario`, `cod_rol`) VALUES
(1, 'Alejandro', 'Torres', 75, 'Hipertensión', 'O+', 10067890, 3),
(2, 'Camila', 'Mendoza', 60, 'Diabetes tipo 2', 'A-', 107524976, 3),
(3, 'Sebastián', 'Castillo', 65, 'Artritis', 'B+', 10067890, 3),
(4, 'Valentina', 'Herrera', 78, 'Asma', 'AB+', 1022937343, 3),
(5, 'Andrés', 'Lozano', 82, 'Colesterol alto', 'O-', 107524976, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reuniones`
--

CREATE TABLE `reuniones` (
  `cod_Reunion` int(10) NOT NULL,
  `Link_Videollamada` varchar(30) NOT NULL,
  `cod_usuario` int(10) NOT NULL,
  `cod_Residente` int(10) NOT NULL,
  `Cod_rol` int(10) NOT NULL,
  `Fecha_Reunion` date NOT NULL,
  `Disponibilidad_dispoditivos` varchar(30) NOT NULL,
  `Confirmacion_personal` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reuniones`
--

INSERT INTO `reuniones` (`cod_Reunion`, `Link_Videollamada`, `cod_usuario`, `cod_Residente`, `Cod_rol`, `Fecha_Reunion`, `Disponibilidad_dispoditivos`, `Confirmacion_personal`) VALUES
(1, 'https://fakevideocall.com', 123456, 1, 11, '2025-08-30', 'Limitados', 'pendiente'),
(2, 'https://fakevideocall2.com', 10012345, 1, 11, '2025-08-31', 'Limitados', 'Pendiente'),
(3, 'https://fakevideocall3.com', 10067890, 3, 11, '2025-09-02', 'Limitados', 'Pendiente'),
(4, 'https://fakevideocall4.com', 107524976, 4, 11, '2025-09-16', 'Limitados', 'Pendiente'),
(5, 'https://fakevideocall5.com', 30098765, 5, 11, '2025-08-13', 'Limitados', 'Aceptados');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `cod_rol` int(10) NOT NULL,
  `nombre_rol` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`cod_rol`, `nombre_rol`) VALUES
(1, 'administrador'),
(2, 'cuidador'),
(3, 'residente'),
(4, 'tutor'),
(5, 'familiar'),
(6, 'medicamentos'),
(7, 'citas'),
(8, 'informes'),
(9, 'actividades_ludicas'),
(10, 'notificaciones'),
(11, 'reuniones'),
(12, 'visitas'),
(13, 'inventario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `tipo_doc` varchar(16) NOT NULL,
  `doc_id` int(10) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `telefono` bigint(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `contraseña` varchar(32) NOT NULL,
  `cod_rol` int(10) NOT NULL,
  `parentesco` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`tipo_doc`, `doc_id`, `nombre`, `apellido`, `direccion`, `telefono`, `email`, `usuario`, `contraseña`, `cod_rol`, `parentesco`) VALUES
('cc', 123456, 'Laura', 'Gómez', 'Calle 50', 3112221111, 'laura@gmail.com', 'lgomez', 'clave123', 2, ''),
('cc', 10012345, 'juan', 'perez', 'calle 10 #15-20', 3004567890, 'juan.perez@gmail.com', 'jperez', 'passJuan1', 1, ''),
('cc', 10067890, 'carlos', 'rodriguez', 'av siempre viva 742', 3026543210, 'carlos.rodr@gmail.com', 'crodriguez', 'car1os', 4, ''),
('ce', 30098765, 'ana', 'martinez', 'calle 50 #10-12', 3112223344, 'ana.mtz@gmail.com', 'amartinez', 'mari1234', 2, ''),
('cc', 107524976, 'mariana', 'martinez', 'av chile 142', 3134147533, 'marian125@gmail.com', 'mariani', 'martinez125', 4, ''),
('cc', 1022937343, 'sandra', 'jimenez', 'cra 5 #78-15', 3113156888, 'sandra22@gmail.com', 'sandrita', 'sanmenez3', 4, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `visitas`
--

CREATE TABLE `visitas` (
  `cod_Visitas` int(10) NOT NULL,
  `doc_id` int(10) NOT NULL,
  `Nomb_visitante` varchar(50) NOT NULL,
  `cod_Residente` int(10) NOT NULL,
  `Fecha_Visita` date NOT NULL,
  `cod_usuario` int(10) NOT NULL,
  `cod_rol` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `visitas`
--

INSERT INTO `visitas` (`cod_Visitas`, `doc_id`, `Nomb_visitante`, `cod_Residente`, `Fecha_Visita`, `cod_usuario`, `cod_rol`) VALUES
(1, 123456, 'Laura', 1, '2025-08-28', 123456, 12),
(2, 10012345, 'Carlos', 2, '2025-08-30', 10067890, 12),
(3, 10012345, 'juan', 5, '2025-08-31', 10012345, 12),
(4, 107524976, 'mariana', 3, '2025-09-02', 107524976, 12),
(5, 30098765, 'ana', 4, '2025-09-06', 30098765, 12);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_medicamentos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_medicamentos` (
`Cod_medicamento` int(10)
,`nombre_medic` varchar(10)
,`fecha_entrada` date
,`fecha_vencimiento` date
,`disponibilidad` int(150)
,`descrip_novedad` varchar(100)
,`fecha_novedad` date
,`cod_residente` int(10)
,`nombre_residente` varchar(50)
,`apellido_residente` varchar(50)
,`codigo_usuario` int(10)
,`nombre_usuario` varchar(100)
,`apellido_usuario` varchar(100)
,`rol_asignado` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_residentes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_residentes` (
`cod_residente` int(10)
,`nombre_residente` varchar(50)
,`apellido_residente` varchar(50)
,`edad` int(3)
,`patologia` varchar(120)
,`RH` varchar(6)
,`rol_residente` varchar(100)
,`codigo_usuario` int(10)
,`nombre_usuario` varchar(100)
,`apellido_usuario` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_usuarios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_usuarios` (
`codigo_usuario` int(10)
,`nombre_usuario` varchar(100)
,`apellido_usuario` varchar(100)
,`telefono` bigint(15)
,`email` varchar(100)
,`nombre_login` varchar(100)
,`rol` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_medicamentos`
--
DROP TABLE IF EXISTS `vista_medicamentos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_medicamentos`  AS SELECT `m`.`Cod_medicamento` AS `Cod_medicamento`, `m`.`nombre_medic` AS `nombre_medic`, `m`.`fecha_entrada` AS `fecha_entrada`, `m`.`fecha_vencimiento` AS `fecha_vencimiento`, `m`.`disponibilidad` AS `disponibilidad`, `m`.`descrip_novedad` AS `descrip_novedad`, `m`.`fecha_novedad` AS `fecha_novedad`, `res`.`cod_residente` AS `cod_residente`, `res`.`nombre` AS `nombre_residente`, `res`.`apellido` AS `apellido_residente`, `u`.`doc_id` AS `codigo_usuario`, `u`.`nombre` AS `nombre_usuario`, `u`.`apellido` AS `apellido_usuario`, `r`.`nombre_rol` AS `rol_asignado` FROM (((`medicamentos` `m` join `residente` `res` on(`m`.`cod_residente` = `res`.`cod_residente`)) join `usuario` `u` on(`m`.`cod_usuario` = `u`.`doc_id`)) join `roles` `r` on(`m`.`cod_rol` = `r`.`cod_rol`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_residentes`
--
DROP TABLE IF EXISTS `vista_residentes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_residentes`  AS SELECT `res`.`cod_residente` AS `cod_residente`, `res`.`nombre` AS `nombre_residente`, `res`.`apellido` AS `apellido_residente`, `res`.`edad` AS `edad`, `res`.`patologia` AS `patologia`, `res`.`RH` AS `RH`, `r`.`nombre_rol` AS `rol_residente`, `u`.`doc_id` AS `codigo_usuario`, `u`.`nombre` AS `nombre_usuario`, `u`.`apellido` AS `apellido_usuario` FROM ((`residente` `res` join `usuario` `u` on(`res`.`cod_usuario` = `u`.`doc_id`)) join `roles` `r` on(`res`.`cod_rol` = `r`.`cod_rol`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_usuarios`
--
DROP TABLE IF EXISTS `vista_usuarios`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_usuarios`  AS SELECT `u`.`doc_id` AS `codigo_usuario`, `u`.`nombre` AS `nombre_usuario`, `u`.`apellido` AS `apellido_usuario`, `u`.`telefono` AS `telefono`, `u`.`email` AS `email`, `u`.`usuario` AS `nombre_login`, `r`.`nombre_rol` AS `rol` FROM (`usuario` `u` join `roles` `r` on(`u`.`cod_rol` = `r`.`cod_rol`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `actividades_ludicas`
--
ALTER TABLE `actividades_ludicas`
  ADD PRIMARY KEY (`Cod_acti_ludi`),
  ADD KEY `cod_residente` (`cod_residente`);

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`cod_cita`),
  ADD KEY `Id_Residente` (`cod_Residente`);

--
-- Indices de la tabla `informes`
--
ALTER TABLE `informes`
  ADD PRIMARY KEY (`cod_Informes`),
  ADD KEY `Id_Residente` (`cod_Residente`),
  ADD KEY `Num_documento` (`doc_id`),
  ADD KEY `cod_rol` (`cod_rol`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`Cod_inventario`),
  ADD KEY `inventario` (`Cod_medicamento`);

--
-- Indices de la tabla `medicamentos`
--
ALTER TABLE `medicamentos`
  ADD PRIMARY KEY (`Cod_medicamento`),
  ADD KEY `id_usuario` (`cod_usuario`),
  ADD KEY `id_residente` (`cod_residente`),
  ADD KEY `cod_rol` (`cod_rol`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`cod_Notificaciones`),
  ADD KEY `Id_usuario` (`cod_usuario`),
  ADD KEY `Id_Residente` (`cod_Residente`),
  ADD KEY `Cod_rol` (`Cod_rol`);

--
-- Indices de la tabla `residente`
--
ALTER TABLE `residente`
  ADD PRIMARY KEY (`cod_residente`),
  ADD KEY `id_usuario` (`cod_usuario`),
  ADD KEY `cod_rol` (`cod_rol`);

--
-- Indices de la tabla `reuniones`
--
ALTER TABLE `reuniones`
  ADD PRIMARY KEY (`cod_Reunion`),
  ADD KEY `Id_usuario` (`cod_usuario`),
  ADD KEY `Id_Residente` (`cod_Residente`),
  ADD KEY `Cod_rol` (`Cod_rol`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`cod_rol`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`doc_id`),
  ADD KEY `cod_rol` (`cod_rol`);

--
-- Indices de la tabla `visitas`
--
ALTER TABLE `visitas`
  ADD PRIMARY KEY (`cod_Visitas`),
  ADD KEY `Id_usuario` (`cod_usuario`),
  ADD KEY `Id_Residente` (`cod_Residente`),
  ADD KEY `cod_rol` (`cod_rol`),
  ADD KEY `doc_id` (`doc_id`);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividades_ludicas`
--
ALTER TABLE `actividades_ludicas`
  ADD CONSTRAINT `actividades_ludicas_ibfk_1` FOREIGN KEY (`cod_residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`cod_Residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `informes`
--
ALTER TABLE `informes`
  ADD CONSTRAINT `informes_ibfk_1` FOREIGN KEY (`cod_Residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `informes_ibfk_2` FOREIGN KEY (`doc_id`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `informes_ibfk_3` FOREIGN KEY (`cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `inventario` FOREIGN KEY (`Cod_medicamento`) REFERENCES `medicamentos` (`Cod_medicamento`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `medicamentos`
--
ALTER TABLE `medicamentos`
  ADD CONSTRAINT `medicamentos_ibfk_1` FOREIGN KEY (`cod_usuario`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `medicamentos_ibfk_2` FOREIGN KEY (`cod_residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `medicamentos_ibfk_3` FOREIGN KEY (`cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`cod_usuario`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`cod_Residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_3` FOREIGN KEY (`Cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `residente`
--
ALTER TABLE `residente`
  ADD CONSTRAINT `residente_ibfk_1` FOREIGN KEY (`cod_usuario`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `residente_ibfk_2` FOREIGN KEY (`cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `reuniones`
--
ALTER TABLE `reuniones`
  ADD CONSTRAINT `reuniones_ibfk_1` FOREIGN KEY (`cod_usuario`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reuniones_ibfk_2` FOREIGN KEY (`cod_Residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reuniones_ibfk_3` FOREIGN KEY (`Cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `visitas`
--
ALTER TABLE `visitas`
  ADD CONSTRAINT `visitas_ibfk_1` FOREIGN KEY (`cod_usuario`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitas_ibfk_2` FOREIGN KEY (`cod_Residente`) REFERENCES `residente` (`cod_residente`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitas_ibfk_3` FOREIGN KEY (`cod_rol`) REFERENCES `roles` (`cod_rol`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `visitas_ibfk_4` FOREIGN KEY (`doc_id`) REFERENCES `usuario` (`doc_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
