## Escaneo

### Ping
En primer lugar se ejecuta el comando _ping_ para lograr conocer el sistema
operativo de la máquina objetivo. En este caso como se puede ver en la imagen
[1](img/0ping.png "_Ping_  a máquina objetivo"), la máquina vı́ctima cuenta con un TTL de 63, siendo este el utilizado por las
máquinas que cuentan con un sistema operativo UNIX.


![señal a máquina objetivo | center](img/0ping.png )


### NMAP

El siguiente paso será realizar un reconocimiento para localizar los puer-
tos abiertos de la máquina. A través del empleo de la herramienta nmap y el
siguiente comando, se obtienen los puertos visibles en la fotografı́a [2](img/1allPortos.png ).

```
nmap -p- --open --min-rate 5000 -sS -n -Pn <IP> -oN allPorts
```

- -p-: escaneo de todos los puertos.
- –open: se muestran los puertos abiertos exclusivamente.
- –min-rate: tasa de envı́o de paquetes.
- -sS: Opción por defecto, escaneo rápido.
- -n: no se aplica resolución DNS.
- -Pn: se evita el descubrimiento de hosts.

![Puertos abiertos en la máquina | center](img/1allPortos.png )

Los puertos abiertos se corresponden con los servicios ssh, http y SMB. A
continuación, se obtendrán las versiones de los servicios que corren en dichos
puertos.

```
nmap -p22,80,139,445 -sCV <IP> -oN versionPorts
```

Obteniendo los siguientes resultados (figura [3](img/2VersionPorts.png )):

![Versiones de los servicios | center](img/2VersionPorts.png )

Realizando un análisis de las versiones, se encuentra que la empleada por
el servicio ssh está desactualizada. Este dato podrı́a ser de utilidad frente a un
ataque de enumeración de usuarios.
Se realiza consecuentemente el análisis de los puertos 139 y 445. En último
lugar, un análisis de la web alojada en el servicio http, que en una primera
estancia parece ser la página por defecto de un servidor apache de Ubuntu (fig
[4](img/3porto80.png )).

![Página principal| center](img/3porto80.png )

## RECONOCIMIENTO

### Puerto 139 y 445
El servicio que corre tras estos dos puertos es el denominado como SMB, el
cual hace uso compartido de archivos. En este caso, a través de la enumeración
se ha descubierto que se trata de una máquina Linux, por lo que en primer lugar,
se utilizará la herramienta _enum4linux_, la cual realiza una tarea de enumeración
del sistema SMB de la máquina.

```
enum4linux -a <IP>
```

Los resultados obtenidos muestran que existe un directorio en el disco que
no cuenta con autenticación (figura [5](img/8enum4linux.png)).

![Página principal| center](img/8enum4linux.png)

Para entrar a dicha localización se emplea la herramienta smbclient. La eje-
cución de este revela un archivo denominado _enter.txt_ (figura [6](img/9smbclient.png)).

![Página principal| center](img/9smbclient.png)

Una vez guardado el archivo en la máquina local, se procede a la visualización
de su contenido, siendo este el mostrado en la siguiente imagen (figura [7](img/10enter.png)).

![Página principal| center](img/10enter.png)

De este archivo se consigue un nuevo directorio de la página que se encuentra
utilizando el puerto 80 de la máquina. Además, se aprecia la existencia de Word-
press. En último lugar, aparecen en el archivo las credenciales de administrador
para el panel de _login_ del directorio subrion.

### Descifrado de credenciales

En esta sección se mostrará como se han obtenido en texto plano las cre-
denciales que se pueden visualizar en la imagen [7](img/10enter.png). No solo se encuentra el hash
perteneciente a la contraseña del administrador, sino que se indica el algoritmo
de cifrado empleado. Por lo tanto, haciendo uso de la página [Cyberchef](https://gchq.github.io/CyberChef/) y el
algoritmo _Magic_, se obtiene lo siguiente (figura [8](img/12password.png)):

![Página principal| center](img/12password.png)

Una vez obtenida la contraseña, el siguiente paso será realizar el análisis del
servicio _http_.

### Fuzzing
Para comenzar a realizar el análisis del servicio _http_, se realizará una recolec-
ción de directorios y ficheros accesibles que guarden relevancia para la resolución
de la máquina. Para lograr esto se ha utilizado la herramienta _ffuf_ y diferentes
diccionarios disponibles en [SecLists](https://github.com/danielmiessler/SecLists).
En primer lugar se realiza el descubrimiento de directorios. Utilizando el
siguiente comando se obtienen los directorios visibles en la imagen [9](img/4ffufDirectorios.png).

```
ffuf -w <raft-medium-directories.txt> -u <url>
```

![Página principal| center](img/4ffufDirectorios.png)

Por lo tanto, a estas alturas de la investigación se han encontrado los si-
guientes directorios que posteriormente serán analizados:

- /subrion/panel
- /test/
- /wordpress/

En cuanto a nivel de ficheros se ha podido encontrar _phpinfo.php_, que posee
importancia en una situación real, pero en esta máquina no es de relevancia.

### Análisis de directorios

En esta sección se realizará un análisis sobre los diferentes directorios encon-
trados, esto es, se aplicará _fuzzing_, se revisará el código fuente en caso de poder
encontrar algún comentario o ruta que revele información.

#### Test

Este directorio ha primera vista se muestra una página de Microsoft sobre
la que salen diferentes notificaciones de intentos de intrusión (figura [10](img/5test.png)).

![Página principal| center](img/5test.png)

En este directorio no se encuentra nada interesante realizando _fuzzing_ y
investigación sobre código fuente.

#### Wordpress

El directorio denominado como _wordpress_, muestra inicialmente una página
de soporte de una compañı́a (figura [11](img/6wordpress.png)). Realizando _fuzzing_ se ha encontrado
un acceso a _wp-admin_, sobre el cual se podrı́a realizar un ataque de fuerza bruta
para intentar lograr un inicio de sesión.

![Página principal| center](img/6wordpress.png)

##### Subrion

Este directorio pertenece al sistema de gestión de contenido (CMS) _Subrion_,
en este caso con la versión 4.2, obtenida utilizando la herramienta _whatweb_
(figura [12](img/14subrionVersion.png)).

![Página principal| center](img/14subrionVersion.png)

Anteriormente se habı́a conseguido las credenciales necesarias para acceder
al panel de administrador, por lo tanto se accede a este (figura [13](img/13panel.png)).

![Página principal| center](img/13panel.png)

Tras realizar el acceso al panel principal de administración, y ya conociendo
la versión del software utilizado, el siguiente paso será la detección de posibles
vulnerabilidades de este. Empleando la herramienta _searchsploit_ se encuentra
una serie de vulnerabilidades para la versión del software empleado, ası́ como
de versiones que la preceden.

```
searchsploit subrion 4.2
```

En la siguiente figura ([14](img/15searchsploit.png)) se aprecia que una de estas vulnerabilidades ex-
plota una subida arbitraria de archivo (_Arbitrary Upload Files_).

![Página principal| center](img/15searchsploit.png)

Una vez obtenido el script desarrollado en el lenguaje _python_, se abre para
entender el funcionamiento de este y poder comprender como se explota la
vulnerabilidad. Para recuperar dicho script se ejecuta el comando:

```
searchsploit -m <script>
```

El siguiente paso será la explotación de la vulnerabilidad para conseguir
unha consola que nos permitirá conectarnos al servidor remoto.

## Explotación

En esta sección se mostrarán los pasos seguidos para lograr una conexión
con el servidor remoto, la cual permitirá resolver la máquina.
En la sección previa se habı́a localizado una vulnerabilidad que permite la
subida arbitraria de archivos, y gracias al script recuperado con la herramien-
ta _searchsploit_, se localiza un subdirectorio /_uploads_. Dicho directorio también
podrı́a ser encontrado realizando una navegación a través del panel de adminis-
tración.
Tras el hallazgo del nuevo subdirectorio, existen dos vı́as de explotación de
la vulnerabilidad. Estas son:

- Manualmente.
- Utilización del script proporcionado por _searchsploit_.

A continuación, se expondrán ambas vı́as, permitiendo ver como se consigue
el acceso al servidor. Se expondrá en primer lugar la forma manual, pero no
contará con tanta profundidad como el caso de la utilización del script, aunque
el procedimiento posterior a la entrada en el servidor es el mismo en ambos
casos.

### Ejecución manual

A raı́z de la visualización del archivo de explotación, se crea un archivo que
contenga una _reverse shell_ en formato _php_, que para su subida este debe de
contener la extensión ._phar_.
Dicho archivo se puede descargar de [PentestMonkey](https://github.com/pentestmonkey/php-reverse-shell), editando los campos necesarios para poder conectarse a la máquina local (figura [15](img/25shellphp.png)).

![Página principal| center](img/25shellphp.png)

Una vez creado el archivo se sube en el apartado correspondiente de la url y
se pone la máquina local a la escucha con el comando _netcat_.

```
nc -nlvp 4444
```

Finalmente, se ejecuta el archivo y se obtiene la reverse shell (figuras [16](img/26Execution.png) y [17](img/27ReverseShell.png)).

![Página principal| center](img/26Execution.png)

![Página principal| center](img/27ReverseShell.png)

### Ejecución de script

La segunda técnica será la utilización del script previamente descargado al
equipo. Para la ejecución de este se deberá indicar la dirección objetivo, ası́
como el usuario y contraseña del administrador (figura [18](img/16ScriptRce.png)).

![Página principal| center](img/16ScriptRce.png)

Tras la ejecución del script se obtiene una _reverse shell_, la cual nos indica
que se tiene acceso al servidor remoto. Este script crea un archivo de nombre
aleatorio y con extensión ._phar_ que será almacenado en el subdirectorio /_uploads_
(figura [19](img/17executeScript.png)).

![Página principal| center](img/17executeScript.png)

Una vez dentro del servidor remoto, se navega al directorio /_home_ de la
máquina, lo que permite descubrir el nombre del usuario (_scamsite_), como se
visualiza en la siguiente imagen ([20](img/17.1Username.png)).

![Página principal| center](img/17.1Username.png)

Tras realizar una investigación para comprobar si existe algún directorio
oculto de interés, se procede a la exploración de los otros directorios principales
encontrados durante el proceso de reconocimiento (test y wordpress).
El primero de estos directorios posee permisos de administrador, por lo que
no es accesible. Mientras tanto, el segundo de estos directorios si permite una
navegación, pudiendo localizar y visualizar archivos de relevancia, como en es-
te caso es _wp-config.php_ (figura [21](img/18credswordpress.png)). Es en este archivo donde se localiza una contraseña que será utilizada para realizar una conexión a través del servicio _ssh_.

![Página principal| center](img/18credswordpress.png)

#### Conexión SSH

Tras la ejecución del script se obtienen un usuario y una contraseña, por lo
que el siguiente paso será el intento de conexión a través del servicio _ssh_.

```
ssh scamsite@<IP>
```

Al introducir la contraseña, el sistema proporcionará acceso al servidor como
el usuario indicado (figura [22](img/19ssh.png)).

![Página principal| center](img/19ssh.png)

En esta máquina no se establece ninguna _flag_ de usuario, y no existe ningún
archivo de interés en ningún directorio, por lo tanto, se realizará una investiga-
ción sobre como conseguir los privilegios necesarios para poder conseguir la _flag_
necesaria.
En primer lugar, se consigue la versión de kernel que utiliza la máquina. En
este caso, la versión empleada es vulnerable a una escalada local de privilegios
(figura [23](img/20KernelExplotation.png)), pero no se podrá ejecutar el exploit correspondiente puesto que no
se conseguirá el objetivo por falta de dependencias.

![Página principal| center](img/20KernelExplotation.png)

A continuación, se listan los permisos del usuario, mostrando ası́, que existe
un comando como superusuario sin ninguna contraseña (figura [24](img/22permisos.png)). Este comando será _iconv_ y no permitirá realizar unha escalada de privilegios, sino que como se verá, permite realizar la lectura de archivos con permisos de superusuario.

![Página principal| center](img/22permisos.png)

Para lograr realizar la ejecución, se visita la página [GTFOBins](https://gtfobins.github.io/), que mostrará el proceso necesario para poder conseguir ejecutar el comando realizando un
_bypass_ de las restricciones de seguridad (figura [25](img/23gtfobins.png)).

![Página principal| center](img/23gtfobins.png)

Finalmente, ejecutando el siguiente comando se conseguirá recuperar la _flag_ de _root_, como se muestra en la última figura del documento (figura [26](img/24RootFlag.png)).

```
LFILE=/root/root.txt
# 8859_1: indica que los caracteres es ISO 8859-1
sudo iconv -f 8859_1 -t 8859_1 "\$LFILE"
```

![Página principal| center](img/24RootFlag.png)


