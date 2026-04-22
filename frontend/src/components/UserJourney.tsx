import { useState, useEffect } from 'react';

const STEPS = [
  {
    step: 1,
    title: 'Подключение',
    desc: 'Gmail подключён. Сканируем письма...',
    color: '#3b82f6'
  },
  {
    step: 2,
    title: 'Анализ',
    desc: 'Найдено 49 сервисов. Проверяем утечки...',
    color: '#f59e0b'
  },
  {
    step: 3,
    title: 'Проблемы',
    desc: '6 сервисов с утечками, 3 с избыточным доступом',
    color: '#ff3355'
  },
  {
    step: 4,
    title: 'Действие',
    desc: 'Кликни на красный сервис → удали данные',
    color: '#10b981'
  },
];

export default function UserJourney() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      setTimeout(() => setVisible(false), 2000);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  if (!visible || currentStep >= STEPS.length) return null;

  const step = STEPS[currentStep];

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.9)',
      border: `1px solid ${step.color}`,
      borderRadius: '12px',
      padding: '12px 20px',
      zIndex: 30,
      textAlign: 'center',
      minWidth: '320px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        fontSize: '11px',
        color: step.color,
        marginBottom: '4px',
        letterSpacing: '1px'
      }}>
        ШАГ {step.step} / {STEPS.length}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#fff',
        fontWeight: '600'
      }}>
        {step.title}
      </div>
      <div style={{
        fontSize: '12px',
        color: '#aaa',
        marginTop: '4px'
      }}>
        {step.desc}
      </div>
    </div>
  );
}
