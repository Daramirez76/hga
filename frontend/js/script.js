class validateForm{
    constructor(nombre,apellido,tipo_doc,num_doc,direccion,telefono,correo,usuario,contraseña){
        this.nombre = nombre;
        this.apellido = apellido;
        this.tipo_doc = tipo_doc;
        this.num_doc = num_doc;
        this.direccion = direccion;
        this.telefono = telefono;
        this.correo = correo;
        this.usuario = usuario;
        this.contraseña = contraseña;
    }

    get nombre(){
        return this.nombre = document.getElementById("nombre")
    }

    get apellido(){
        return this.nombre = document.getElementById("apellido")
    }

    get tipo_doc(){
        return this.nombre = document.getElementById("tipo_doc")
    }

    get num_doc(){
        return this.nombre = document.getElementById("num_doc")
    }

    get direccion(){
        return this.nombre = document.getElementById("direccion")
    }

    get telefono(){
        return this.nombre = document.getElementById("telefono")
    }

    get correo(){
        return this.nombre = document.getElementById("correo")
    }

    get usuario(){
        return this.nombre = document.getElementById("usuario")
    }

    get contraseña(){
        return this.nombre = document.getElementById("contraseña")
    }

    validar_nombre(){
        if(isNaN(this.nombre)){
            alert("xd")
        }else if(this.nombre === " "){
            alert("nose")
        }
    }

















}