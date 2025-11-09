# 📱 Davivienda React Native App

Aplicación móvil con React Native, TypeScript y Arquitectura Limpia.

## 🏗️ Arquitectura Limpia (Clean Architecture)

```
src/
├── core/                          # Capa de Dominio (Reglas de Negocio)
│   ├── domain/
│   │   ├── entities/             # Entidades del dominio
│   │   │   └── User.ts
│   │   └── repositories/         # Interfaces de repositorios
│   │       └── AuthRepository.ts
│   └── usecases/                 # Casos de uso (Lógica de negocio)
│       ├── LoginUseCase.ts
│       └── RegisterUseCase.ts
│
├── data/                          # Capa de Datos
│   ├── datasources/              # Fuentes de datos (API, DB local)
│   ├── models/                   # Modelos de datos (DTOs)
│   └── repositories/             # Implementación de repositorios
│       └── AuthRepositoryImpl.ts
│
├── presentation/                  # Capa de Presentación (UI)
│   ├── screens/                  # Pantallas
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── components/               # Componentes reutilizables
│   │   ├── CustomInput.tsx
│   │   └── CustomButton.tsx
│   ├── navigation/               # Navegación (React Navigation)
│   ├── hooks/                    # Custom Hooks
│   ├── stores/                   # Estado global (Zustand)
│   │   └── authStore.ts
│   └── theme/                    # Estilos y tema
│       └── styles.ts
│
├── infrastructure/                # Capa de Infraestructura
│   ├── config/                   # Configuración (Firebase, APIs)
│   └── services/                 # Servicios externos
│
└── shared/                        # Compartido entre capas
    ├── utils/                    # Utilidades
    │   └── validations.ts
    ├── constants/                # Constantes
    │   └── colors.ts
    └── types/                    # Tipos TypeScript globales
```

## 🎯 Principios Aplicados

### SOLID
- **S**ingle Responsibility: Cada clase tiene una única responsabilidad
- **O**pen/Closed: Abierto para extensión, cerrado para modificación
- **L**iskov Substitution: Las implementaciones pueden sustituir interfaces
- **I**nterface Segregation: Interfaces específicas y pequeñas
- **D**ependency Inversion: Dependemos de abstracciones, no de implementaciones

### DRY (Don't Repeat Yourself)
- Componentes reutilizables (`CustomInput`, `CustomButton`)
- Estilos compartidos en `theme/styles.ts`
- Validaciones centralizadas en `shared/utils/validations.ts`
- Constantes en archivos separados

## 🛠️ Tecnologías

- **React Native** - Framework móvil
- **TypeScript** - Tipado estático
- **Expo** - Toolchain y SDK
- **Zustand** - Manejo de estado global
- **Clean Architecture** - Arquitectura de capas

## 🚀 Características

- ✅ Login con validaciones
- ✅ Registro con validaciones (nombre, email, contraseña)
- ✅ Manejo de estado con Zustand
- ✅ Diseño simple con rojo Davivienda (#ED1C24)
- ✅ Validaciones en tiempo real
- ✅ Arquitectura escalable y mantenible
- ✅ Separación de responsabilidades
- ✅ Fácil de testear

## 📱 Ejecutar

```bash
npm start        # Iniciar Metro Bundler
npm run android  # Ejecutar en Android
npm run ios      # Ejecutar en iOS
npm run web      # Ejecutar en Web
```

## 🧪 Testing

```bash
npm test         # Ejecutar tests
```

## 📝 Flujo de Datos

1. **Usuario interactúa** → Presentation Layer (UI)
2. **UI ejecuta** → Use Case (Core Layer)
3. **Use Case usa** → Repository Interface (Core Layer)
4. **Repository implementa** → Data Layer
5. **Data Layer llama** → Infrastructure Layer (API, Firebase, etc.)

## 🎨 Diseño

- Color primario: `#ED1C24` (Rojo Davivienda)
- Diseño minimalista y limpio
- Inputs con validación visual
- Botones con estados de carga
- Responsive para móvil y web
