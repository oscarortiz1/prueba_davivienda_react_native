# 🎨 Diseño de la App - Encuestas Davivienda

## 📱 Características del Diseño

### Pantallas Implementadas

#### 1. **Login Screen** 📊
- Ícono circular con fondo rojo Davivienda y emoji de gráfico
- Título "Encuestas Davivienda"
- Subtítulo "Inicia sesión para continuar"
- Campos: Email y Contraseña con validaciones
- Botón principal con sombra
- Link para registro
- Footer con mensaje descriptivo

#### 2. **Register Screen** 📝
- Ícono circular con emoji de documento
- Título "Crear Cuenta"
- Subtítulo "Únete a Encuestas Davivienda"
- Campos: Nombre, Email y Contraseña con validaciones
- Botón principal con sombra
- Link para login
- Footer con términos y condiciones

#### 3. **Home Screen** 🎯
- Ícono circular de bienvenida
- Información del usuario (nombre y email)
- Cards de funcionalidades:
  - 📊 Mis Encuestas
  - 📝 Responder
  - 📈 Resultados
- Botón de cerrar sesión

## 🎨 Elementos de Diseño

### Iconos Circulares
```
- Tamaño: 80x80
- Border Radius: 40
- Color de fondo: #ED1C24 (Rojo Davivienda)
- Sombra con color primario
- Emoji centrado (40px)
```

### Inputs
```
- Altura: 52px
- Border: 2px
- Border Radius: 12px
- Padding horizontal: 16px
- Color de borde: #E5E5E5
- Error: Borde rojo con fondo #FFF5F5
```

### Botones
```
- Altura: 52px
- Border Radius: 12px
- Color: #ED1C24
- Sombra elevada con color primario
- Texto en negrita con letter-spacing
```

### Cards (Home)
```
- Background: Blanco
- Border Radius: 12px
- Padding: 20px
- Border: 1px #E5E5E5
- Sombra suave
- Elevation: 3
```

## 📐 Layout

### Máximo Ancho
- La app tiene un `maxWidth: 430px` para simular un dispositivo móvil en web
- En web muestra sombras y border radius para parecer un celular
- En móvil nativo ocupa toda la pantalla

### Espaciado
- Container padding: 24px
- Margen entre elementos: 16-20px
- Margen de headers: 30-40px

### Colores
```typescript
{
  primary: '#ED1C24',        // Rojo Davivienda
  primaryDark: '#C41820',    // Rojo oscuro
  primaryLight: '#FF6B70',   // Rojo claro
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#E5E5E5',
  error: '#FF3B30',
  success: '#34C759',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
}
```

## ✨ Detalles de UX

1. **Validaciones en tiempo real** - Los inputs muestran errores al perder el foco
2. **Estados de carga** - Botones con spinner durante peticiones
3. **Feedback visual** - Alertas de éxito y error
4. **Scroll automático** - KeyboardAvoidingView para iOS
5. **Accesibilidad** - Placeholders descriptivos y mensajes claros
6. **Diseño consistente** - Mismo estilo en todas las pantallas

## 🎯 Contexto de Uso

App diseñada para **encuestas empresariales** de Davivienda con:
- Creación de encuestas
- Respuesta de encuestas
- Visualización de resultados
- Gestión de usuarios

El diseño es **simple, profesional y enfocado en productividad**.
