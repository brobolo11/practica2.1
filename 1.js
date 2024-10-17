"use strict"
const mysql = require('mysql');
const readlinesync = require('readline-sync');
const {DateTime} = require('luxon');

var conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
});

conexion.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.clear()
    console.log("Conectado con exito.");
    crearAdmin(); // Llamar a la funcion para verificar y crear el admin
});

conexion.query('CREATE DATABASE IF NOT EXISTS relacional;');
conexion.query('USE relacional');
conexion.query('CREATE TABLE IF NOT EXISTS alumnos(indice INT, dni VARCHAR(9) PRIMARY KEY, nombre VARCHAR(50), apellido1 VARCHAR(50), apellido2 VARCHAR(50), direccion VARCHAR(50), tlf INT(9), fNac DATE);');
conexion.query('CREATE TABLE IF NOT EXISTS admins(id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(50), clave VARCHAR(50));');

function crearAdmin() {
    // Verificar si ya existe el usuario "admin"
    conexion.query('SELECT * FROM admins WHERE nombre = "admin";', (err, resultados) => {
        if (err) {
            console.error("Error verificando el usuario admin:", err);
            return;
        }

        if (resultados.length === 0) {
            // Si no existe, crear el usuario admin
            conexion.query('INSERT INTO admins (nombre, clave) VALUES ("admin", "1234");', (err) => {
                if (err) {
                    console.error("Error creando el usuario admin:", err);
                    return;
                }
                console.log('Usuario "admin" creado.');
                login(); // Proceder a iniciar sesion despues de crear el admin
            });
        } else {
            // Si ya existe, proceder al login directamente
            login();
        }
    });
}

function login() {
    let usuario = readlinesync.question("Ingrese sus credenciales de administrador: ");

    conexion.query('SELECT * FROM admins WHERE nombre = ?', [usuario], (err, resultados) => {
        if (err) {
            console.error('Error durante la consulta de usuarios: ', err);
            return;
        }

        if (resultados.length == 0) {
            
            console.log('Usuario no encontrado.');
            login()

        } else {
            let contrasena = readlinesync.question("Ingrese la contrasena: ", { hideEchoBack: true });

            if (resultados[0].clave === contrasena) {
                console.log('¡Inicio de sesion exitoso!');
                menu();
            } else {
                console.log('Contrasena incorrecta.');
                login()
            }            
        }
    });
}

function nuevoAlumno() {

    const letras = "TRWAGMYFPDXBNJZSQVHLCKE";

    let nombre = readlinesync.question("Nombre del nuevo alumno: ");

    if (nombre !== "") {
        let dni = readlinesync.question("DNI del nuevo alumno: ");

        const numero = dni.substring(0, 8);
        const letra = dni.charAt(8).toUpperCase();
        const letraEsperada = letras[numero % 23];

        if (dni.length !== 9 || !/^\d{8}$/.test(numero)) {
            console.log("Formato de DNI incorrecto o numero incorrecto");
            menu();
        } else if (letra !== letraEsperada) {
            console.log(`El DNI es incorrecto. La letra deberia ser ${letraEsperada}`);
            menu();
        } else {
            let apellido1 = readlinesync.question("Primer apellido del nuevo alumno: ");
            if (apellido1 !== "") {
                let apellido2 = readlinesync.question("Segundo apellido del nuevo alumno: ");
                if (apellido2 !== "") {
                    let direccion = readlinesync.question("Direccion del nuevo alumno: ");
                    if (direccion !== "") {
                        let tlf = readlinesync.question("Numero de telefono del nuevo alumno: ");
                        if (tlf.length !== 9 || isNaN(tlf)) {
                            console.log("El telefono tiene que tener 9 digitos y ser numerico");
                            menu();
                        } else {
                            let dayBirthday = readlinesync.question("Dia de nacimiento: ");
                            let monthBirthday = readlinesync.question("Mes de nacimiento: ");
                            let yearBirthday = readlinesync.question("Ano de nacimiento: ");

                            dayBirthday = dayBirthday.padStart(2, "0");
                            monthBirthday = monthBirthday.padStart(2, "0");

                            // Crear el objeto de fecha usando luxon
                            let fechaNacimiento = DateTime.fromObject({
                                year: parseInt(yearBirthday),
                                month: parseInt(monthBirthday),
                                day: parseInt(dayBirthday)
                            });

                            // Convertir la fecha para la base de datos
                            let fechaNacimientoBBDD = `${yearBirthday}-${monthBirthday}-${dayBirthday}`;

                            if (parseInt(yearBirthday) >= 1930) {
                                if (fechaNacimiento.isValid) {
                                    // Obtener el indice mas alto y sumar uno para el nuevo alumno
                                    conexion.query('SELECT MAX(indice) AS maxIndice FROM alumnos', (err, data) => {
                                        if (err) {
                                            console.log("Error obteniendo el indice maximo");
                                            menu();
                                        } else {
                                            let numIndice = (data[0].maxIndice || 0) + 1;

                                            conexion.query('INSERT INTO alumnos VALUES (?, ?, ?, ?, ?, ?, ?, ?);', 
                                                [numIndice, dni, nombre, apellido1, apellido2, direccion, tlf, fechaNacimientoBBDD], 
                                                (err) => {
                                                    if (err) {
                                                        console.log("Error insertando alumno");
                                                    } else {
                                                        console.log("Alumno creado con exito");
                                                    }
                                                    menu();
                                                }
                                            );
                                        }
                                    });
                                } else {
                                    console.log("Fecha de nacimiento incorrecta");
                                    menu();
                                }
                            } else {
                                console.log("Ano no valido. Debe ser mayor o igual a 1930.");
                                menu();
                            }
                        }
                    } else {
                        console.log("La direccion es necesaria");
                        menu();
                    }
                } else {
                    console.log("El segundo apellido es necesario");
                    menu();
                }
            } else {
                console.log("El primer apellido es necesario");
                menu();
            }
        }
    } else {
        console.log("El nuevo alumno tiene que tener un nombre.");
        menu();
    }
}

function borrarAlumno() {
    try {
        conexion.query('SELECT * FROM alumnos', (err, data) => {
            if(err){
                console.log("Error", err)
                menu();
            } else if(data.length == 0){
                console.log("No hay alumnos disponibles para eliminar")
                menu();
            } else {
                for(let cadaAlumno of data){
                    console.log(`DNI: ${cadaAlumno.dni} Nombre: ${cadaAlumno.nombre} ${cadaAlumno.apellido1} ${cadaAlumno.apellido2}`)
                }
                let dniAlumno = readlinesync.question("DNI del usuario a borrar: ");

                conexion.query('DELETE FROM alumnos WHERE dni = ?', [dniAlumno], (err) => {
                    if (err) {
                        console.error('Error borrando usuario:', err);
                        menu();
                    } else {
                        console.log('Usuario borrado exitosamente.');
                        menu();
                    }
                });
            }
        })        
    } catch (err) {
        console.error('Error borrando usuario:', err);
    }
}

function listarAlumno() {
    console.log("")
    console.log("1. Filtrar alumnos por nombre.");
    console.log("2. Filtrar alumnos por apellido.");
    console.log("3. Filtrar alumnos por direccion.");
    console.log("4. Salir.");

    const opcion = readlinesync.question("Escoge una opcion: ");

    switch(opcion){
        case "1":
            let nombre = readlinesync.question("Nombre por el que quieras filtrar: ")

            conexion.query('SELECT * FROM alumnos WHERE alumnos.nombre = ?', [nombre], (err, data) => {
                if(err){
                    console.error("Error", err)
                } else if(data.length == 0) {
                    console.log("No hay usuarios que cumplan ese parametro.")
                    listarAlumno()
                } else {
                    for(let cada_alumno of data){
                        console.log(`DNI: ${cada_alumno.dni}, Nombre: ${cada_alumno.nombre} ${cada_alumno.apellido1} ${cada_alumno.apellido2}`)
                    }
                    listarAlumno()
                }
            })
            break;
        case "2":
            let apellido = readlinesync.question("Apellido por el que quieras filtrar: ")

            conexion.query('SELECT * FROM alumnos WHERE alumnos.apellido1 = ? OR alumnos.apellido2 = ?', [apellido, apellido], (err, data) => {
                if(err){
                    console.error("Error", err)
                } else if(data.length == 0){
                    console.log("No hay usuarios que cumplan ese parametro.")
                    listarAlumno()
                } else {
                    for(let cada_alumno of data){
                        console.log(`DNI: ${cada_alumno.dni},  Nombre: ${cada_alumno.nombre} ${cada_alumno.apellido1} ${cada_alumno.apellido2}`)
                    }
                    listarAlumno()
                }
            })
            break;
        case "3":
            let direccion = readlinesync.question("Direccion por la que quieras filtrar: ")

            conexion.query('SELECT * FROM alumnos WHERE alumnos.direccion = ?', [direccion], (err, data) => {
                if(err){
                    console.error("Error", err)
                } else if(data.length == 0){
                    console.log("No hay usuarios que cumplan ese parametro.")
                    listarAlumno()
                } else {
                    for(let cada_alumno of data){
                        console.log(`DNI: ${cada_alumno.dni}, Nombre: ${cada_alumno.nombre} ${cada_alumno.apellido1} ${cada_alumno.apellido2}, Direccion: ${cada_alumno.direccion}`)
                    }
                    listarAlumno()
                }
            })
            break;
        case "4":
            menu()
            break;
        default:
            console.log("Respuesta no valida");
            listarAlumno();
    }
}

function modificarAlumno(){
    conexion.query('SELECT * FROM alumnos', (err, data) => {
        if(err){
            console.error("Error", err)
            menu()
        } else if(data.legnth == 0){
            console.log("No hay usuarios disponibles.")
            menu()
        } else {
            for(let cada_alumno of data){
                console.log(`DNI: ${cada_alumno.dni}, Nombre: ${cada_alumno.nombre} ${cada_alumno.apellido1} ${cada_alumno.apellido2}`)
            }
            modificaciones()
        }
    })
}

function modificaciones(){
    
    let alumnoModificar = readlinesync.question("Pon el DNI del usuario que quieras modificar: ")
    console.clear()

    conexion.query('SELECT * FROM alumnos WHERE alumnos.dni = ?', [alumnoModificar], (err, data) => {
        if(err){
            console.error("Error", err)
        } else if(data.length == 0){
            console.log("No hay usuarios con ese dni.")
            modificarAlumno()
        } else {
            for(let cada_alumno of data){
                console.log(`DNI: ${cada_alumno.dni}, Nombre: ${cada_alumno.nombre} Apellido1: ${cada_alumno.apellido1} Apellido2: ${cada_alumno.apellido2}, Direccion: ${cada_alumno.direccion}, Telefono: ${cada_alumno.tlf}, Fecha Nacimiento: ${cada_alumno.fNac}`)
            }
            console.log("\nParametros a modificar: \n")
            console.log("1. Nombre")
            console.log("2. Primer apellido")
            console.log("3. Segundo apellido")
            console.log("4. Direccion")
            console.log("5. Telefono")
            console.log("6. Fecha nacimiento")
            console.log("7. Salir")

            const opcion = readlinesync.question("Escoge un campo a modificar: ")

            switch(opcion){
                case "1":
                    let nuevoNombre = readlinesync.question("Nuevo nombre del usuario: ")

                    conexion.query('UPDATE alumnos SET alumnos.nombre = ? WHERE alumnos.dni = ?', [nuevoNombre, alumnoModificar], (err) => {
                        if(err){
                            console.error("Error", err)
                            menu()
                        } else {
                            console.log("Alumno modificado con exito")
                            menu()
                        }
                    })
                    break;
                case "2":
                    let nuevoApellido1 = readlinesync.question("Nuevo primer apellido del usuario: ")

                    conexion.query('UPDATE alumnos SET alumnos.apellido1 = ? WHERE alumnos.dni = ?', [nuevoApellido1, alumnoModificar], (err) => {
                        if(err){
                            console.error("Error", err)
                            menu()
                        } else {
                            console.log("Alumno modificado con exito")
                            menu()
                        }
                    })
                    break;
                case "3":
                    let nuevoApellido2 = readlinesync.question("Nuevo segundo apellido del usuario: ")

                    conexion.query('UPDATE alumnos SET alumnos.apellido2 = ? WHERE alumnos.dni = ?', [nuevoApellido2, alumnoModificar], (err) => {
                        if(err){
                            console.error("Error", err)
                            menu()
                        } else {
                            console.log("Alumno modificado con exito")
                            menu()
                        }
                    })
                    break;
                case "4":
                    let nuevaDireccion = readlinesync.question("Nueva direccion del usuario: ")

                    conexion.query('UPDATE alumnos SET alumnos.direccion = ? WHERE alumnos.dni = ?', [nuevaDireccion, alumnoModificar], (err) => {
                        if(err){
                            console.error("Error", err)
                            menu()
                        } else {
                            console.log("Alumno modificado con exito")
                            menu()
                        }
                    })
                    break;
                case "5":
                    let nuevoTlf = readlinesync.question("Nuevo telefono del usuario: ")

                    conexion.query('UPDATE alumnos SET alumnos.tlf = ? WHERE alumnos.dni = ?', [nuevoTlf, alumnoModificar], (err) => {
                        if(err){
                            console.error("Error", err)
                            menu()
                        } else {
                            console.log("Alumno modificado con exito")
                            menu()
                        }
                    })
                    break;
                case "6":
                    let dayBirthday = readlinesync.question("Dia de nacimiento: ");
                    let monthBirthday = readlinesync.question("Mes de nacimiento: ");
                    let yearBirthday = readlinesync.question("Ano de nacimiento: ");

                    dayBirthday = dayBirthday.padStart(2, "0");
                    monthBirthday = monthBirthday.padStart(2, "0");

                    let fechaNacimiento = DateTime.fromObject({
                        year: parseInt(yearBirthday),
                        month: parseInt(monthBirthday),
                        day: parseInt(dayBirthday)
                    });

                    let fechaNacimientoBBDD = `${yearBirthday}-${monthBirthday}-${dayBirthday}`;

                    if (parseInt(yearBirthday) >= 1930) {
                        if (fechaNacimiento.isValid){
                            conexion.query('UPDATE alumnos SET alumnos.fNac = ? WHERE alumnos.dni = ?', [fechaNacimientoBBDD, alumnoModificar], (err) => {
                                if(err){
                                    console.error("Error", err)
                                    menu()
                                } else {
                                    console.log("Alumno modificado con exito")
                                    menu()
                                }
                            })
                        }
                    }
                    break;
                case "7":
                    menu()
                    break;
                default:
                    console.log("Respuesta no valida");
                    menu();
            }
        }
    })
}

function menu() {
    console.log("\nBienvenido al menu\n");
    console.log("1. Nuevo alumno");
    console.log("2. Borrar alumno");
    console.log("3. Listar alumnos");
    console.log("4. Modificar alumno");
    console.log("5. Salir");

    const opcion = readlinesync.question("Escoge una opcion: ");

    switch (opcion) {
        case "1":
            console.clear()
            nuevoAlumno();
            break;
        case "2":
            console.clear()
            borrarAlumno();
            break;
        case "3":
            console.clear()
            listarAlumno();
            break;
        case "4":
            console.clear()
            modificarAlumno();
            break;
        case "5":
            console.log("Saliendo del programa");
            process.exit(0);
        default:
            console.log("Respuesta no valida");
            menu();
    }
}