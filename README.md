# 📊 Sistema de Encuestas Davivienda - Mobile App

Aplicación móvil desarrollada en React Native para la gestión y participación en encuestas, permitiendo a los usuarios crear, publicar, responder y visualizar resultados de encuestas en tiempo real.

## 🚀 Características Principales

### Para Usuarios Autenticados
- ✅ **Autenticación segura** - Sistema de login y registro de usuarios
- 📝 **Creación de encuestas** - Editor completo con múltiples tipos de preguntas
- 📤 **Publicación de encuestas** - Gestión del ciclo de vida de encuestas
- 📊 **Visualización de resultados** - Gráficos interactivos en tiempo real
- 🔗 **Compartir encuestas** - Sistema de enlaces para distribución
- ⏰ **Encuestas con expiración** - Control de fechas límite
- 🗑️ **Gestión de contenido** - Edición y eliminación de encuestas

### Para Respondientes
- 📋 **Responder encuestas** - Interfaz intuitiva y responsive
- ✅ **Validación de respuestas** - Campos obligatorios y validaciones
- 📱 **Experiencia móvil optimizada** - Diseño adaptativo
- 🔄 **Actualización en tiempo real** - Sincronización automática

### Tipos de Preguntas Soportadas
- 📝 Texto corto
- ⭕ Opción múltiple
- ☑️ Casillas de verificación
- 📋 Desplegables
- 📊 Escala (1-5)

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React Native** - Framework para desarrollo móvil multiplataforma
- **TypeScript** - Tipado estático para mayor seguridad
- **React Navigation** - Navegación entre pantallas
- **Zustand** - Gestión de estado global
- **Axios** - Cliente HTTP para consumo de APIs
- **React Native Chart Kit** - Visualización de datos con gráficos

### Librerías Adicionales
- `@react-navigation/native` - Sistema de navegación
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/drawer` - Drawer navigator
- `react-native-chart-kit` - Gráficos y visualizaciones
- `zustand` - State management
- `axios` - HTTP client

## 📁 Estructura del Proyecto

```
src/
├── core/                          # Capa de dominio
│   └── domain/
│       └── entities/              # Entidades del dominio
│           └── Survey.ts
│
├── data/                          # Capa de datos
│   ├── datasources/               # Fuentes de datos
│   │   ├── auth.datasource.ts
│   │   └── survey.datasource.ts
│   └── models/                    # Modelos de datos (DTOs)
│       ├── auth.dto.ts
│       └── survey.dto.ts
│
├── presentation/                  # Capa de presentación
│   ├── components/                # Componentes reutilizables
│   │   ├── CustomButton.tsx
│   │   ├── CustomInput.tsx
│   │   └── Navbar.tsx
│   │
│   ├── hooks/                     # Custom hooks
│   │   └── useAuth.ts
│   │
│   ├── navigation/                # Configuración de navegación
│   │   ├── AuthNavigator.tsx
│   │   ├── DrawerNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   │
│   ├── screens/                   # Pantallas de la aplicación
│   │   ├── login/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── LoginScreen.styles.ts
│   │   ├── register/
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── RegisterScreen.styles.ts
│   │   ├── my-surveys/
│   │   │   ├── MySurveysScreen.tsx
│   │   │   └── MySurveysScreen.styles.ts
│   │   ├── survey-editor/
│   │   │   ├── SurveyEditorScreen.tsx
│   │   │   └── SurveyEditorScreen.styles.ts
│   │   ├── survey-response/
│   │   │   ├── SurveyResponseScreen.tsx
│   │   │   └── SurveyResponseScreen.styles.ts
│   │   └── survey-results/
│   │       ├── SurveyResultsScreen.tsx
│   │       └── SurveyResultsScreen.styles.ts
│   │
│   ├── stores/                    # Estado global con Zustand
│   │   ├── authStore.ts
│   │   ├── surveyStore.ts
│   │   └── toastStore.ts
│   │
│   └── theme/                     # Tema y estilos globales
│       └── styles.ts
│
└── shared/                        # Código compartido
    ├── constants/                 # Constantes globales
    │   └── colors.ts
    └── utils/                     # Utilidades
        ├── http.ts
        └── validations.ts
```

## 🚀 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd prueba_davivienda_react_native
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Instalar dependencias de iOS (solo macOS)**
```bash
cd ios
pod install
cd ..
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
API_BASE_URL=http://localhost:3000/api
```

### Configuración del Backend

Asegúrate de que el backend esté corriendo en el puerto especificado. La URL base de la API se configura en `src/shared/utils/http.ts`.

## 📱 Uso

### Desarrollo

#### Android
```bash
npm run android
# o
yarn android
```

#### iOS
```bash
npm run ios
# o
yarn ios
```

### Iniciar Metro Bundler
```bash
npm start
# o
yarn start
```

### Scripts Disponibles

```bash
# Iniciar la aplicación en Android
npm run android

# Iniciar la aplicación en iOS
npm run ios

# Iniciar Metro bundler
npm start

# Limpiar caché
npm run clean

# Tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura limpia en capas**:

### 1. Core (Dominio)
Contiene las entidades y lógica de negocio independiente del framework.

### 2. Data (Datos)
- **DataSources**: Implementaciones de acceso a datos (API REST)
- **Models**: DTOs para transformación de datos

### 3. Presentation (Presentación)
- **Screens**: Pantallas de la aplicación organizadas por funcionalidad
- **Components**: Componentes reutilizables
- **Stores**: Estado global con Zustand
- **Navigation**: Configuración de navegación
- **Hooks**: Custom hooks para lógica reutilizable

### 4. Shared (Compartido)
Utilidades, constantes y helpers compartidos en toda la aplicación.

## 🎨 Convenciones de Código

### Nomenclatura
- **Componentes**: PascalCase (ej: `LoginScreen.tsx`)
- **Archivos de estilos**: PascalCase con sufijo `.styles.ts` (ej: `LoginScreen.styles.ts`)
- **Hooks**: camelCase con prefijo `use` (ej: `useAuth.ts`)
- **Stores**: camelCase con sufijo `Store` (ej: `authStore.ts`)
- **Utilidades**: camelCase (ej: `validations.ts`)

### Organización de Archivos
- Cada pantalla debe tener su propia carpeta con su componente y estilos
- Los estilos siempre se separan en archivos `.styles.ts`
- Los componentes reutilizables van en `presentation/components/`

### TypeScript
- Usar interfaces para definir tipos de datos
- Tipar todas las funciones y variables
- Evitar el uso de `any`

## 📦 Dependencias Principales

```json
{
  "react-native": "^0.72.0",
  "typescript": "^5.0.0",
  "@react-navigation/native": "^6.1.0",
  "zustand": "^4.4.0",
  "axios": "^1.6.0",
  "react-native-chart-kit": "^6.12.0"
}
```

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para la autenticación:
- Token almacenado en AsyncStorage
- Interceptor de Axios para agregar token en cada petición
- Renovación automática de token en caso de expiración

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Encuestas
- `GET /api/surveys` - Listar encuestas del usuario
- `GET /api/surveys/published` - Listar encuestas publicadas
- `POST /api/surveys` - Crear encuesta
- `PUT /api/surveys/:id` - Actualizar encuesta
- `DELETE /api/surveys/:id` - Eliminar encuesta
- `POST /api/surveys/:id/publish` - Publicar encuesta

### Preguntas
- `POST /api/surveys/:id/questions` - Agregar pregunta
- `PUT /api/surveys/:surveyId/questions/:questionId` - Actualizar pregunta
- `DELETE /api/surveys/:surveyId/questions/:questionId` - Eliminar pregunta

### Respuestas
- `POST /api/surveys/:id/responses` - Enviar respuesta
- `GET /api/surveys/:id/responses` - Obtener respuestas

## 🧪 Testing

Se añadieron pruebas unitarias sencillas con Jest + ts-jest para asegurar el correcto funcionamiento de las utilidades y del almacenamiento global de toasts.

```bash
# Ejecutar los tests unitarios
npm test
```

### Cobertura actual
- `__tests__/validations.test.ts`: verifica las funciones `validateEmail`, `validatePassword` y `validateName`.
- `__tests__/toastStore.test.ts`: comprueba que `useToastStore` muestre/oculte mensajes correctamente y que los helpers (`success`, `error`, etc.) cambien el estado.

Puedes extender la cobertura creando nuevos archivos `*.test.ts` dentro de la carpeta `__tests__/` o actualizando `jest.config.js` si prefieres organizar las suites por características.

## 🐛 Debugging

### React Native Debugger
1. Instalar [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Abrir la herramienta
3. En el dispositivo/emulador, agitar para abrir el menú de desarrollo
4. Seleccionar "Debug"

### Flipper
La aplicación está configurada para usar Flipper para debugging avanzado.

## 📄 Licencia

Este proyecto es parte de una prueba técnica para Davivienda.

## 👥 Autor

Desarrollado por [Tu Nombre]

## 📞 Soporte

Para preguntas o soporte, contacta a [tu-email@ejemplo.com]

---

**Nota**: Este es un proyecto de demostración desarrollado con fines educativos y de evaluación técnica.
