import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '../supabase';

// Configura como notificação será mostrada quando app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = 
    useState<Notifications.Notification | null>(null);
    
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registrarParaPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        salvarTokenNoSupabase(token);
        registrarParaPushNotifications();
      }
    });

    // Listener quando notificação chega (app aberto)
    notificationListener.current = 
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    // Listener quando usuário toca na notificação
    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notificação tocada:', response);
        // Aqui podemos navegar para tela específica
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
}

// ============================================
// Registrar para receber push notifications
// ============================================
async function registrarParaPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications só funcionam em dispositivo físico');
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permissão de notificação negada');
    return null;
  }

  // ⚠️ NO EXPO GO NÃO GERAMOS TOKEN
  console.log('✅ Permissão de notificação concedida (modo Expo Go)');
  return null;
}

// ============================================
// Salva token no Supabase
// ============================================
async function salvarTokenNoSupabase(token: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('motoristas')
      .update({
        expo_push_token: token,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id);

    if (error) {
      console.log('Erro ao salvar push token:', error.message);
    } else {
      console.log('✅ Push token salvo com sucesso');
    }
  } catch (err) {
    console.log('Erro no salvarTokenNoSupabase:', err);
  }
}

// ============================================
// Função pública para disparar notificação local
// Use quando quiser notificar mesmo com app aberto
// ============================================
export async function dispararNotificacaoLocal(
  titulo: string,
  mensagem: string,
  dados?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensagem,
      data: dados ?? {},
      sound: 'default',
    },
    trigger: null, // dispara imediatamente
  });
}