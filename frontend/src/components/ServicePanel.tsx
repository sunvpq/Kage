import React from 'react';

const DATA_CATEGORIES: Record<string, { label: string; category: string; color: string }> = {
  'email':          { label: 'Email',       category: 'personal',     color: '#3b82f6' },
  'phone':          { label: 'Телефон',     category: 'personal',     color: '#3b82f6' },
  'address':        { label: 'Адрес',       category: 'personal',     color: '#3b82f6' },
  'passport':       { label: 'Паспорт',     category: 'personal',     color: '#3b82f6' },
  'iin':            { label: 'ИИН',         category: 'personal',     color: '#3b82f6' },
  'card':           { label: 'Карта',       category: 'financial',    color: '#f59e0b' },
  'payment':        { label: 'Оплата',      category: 'financial',    color: '#f59e0b' },
  'orders':         { label: 'Покупки',     category: 'financial',    color: '#f59e0b' },
  'education_data': { label: 'Учёба',       category: 'educational',  color: '#10b981' },
  'grades':         { label: 'Оценки',      category: 'educational',  color: '#10b981' },
  'courses':        { label: 'Курсы',       category: 'educational',  color: '#10b981' },
  'progress':       { label: 'Прогресс',    category: 'educational',  color: '#10b981' },
  'behavior':       { label: 'Поведение',   category: 'behavioral',   color: '#a855f7' },
  'searches':       { label: 'Поиски',      category: 'behavioral',   color: '#a855f7' },
  'location':       { label: 'Геолокация',  category: 'behavioral',   color: '#a855f7' },
  'watch_history':  { label: 'Просмотры',   category: 'behavioral',   color: '#a855f7' },
  'friends':        { label: 'Контакты',    category: 'social',       color: '#ec4899' },
  'messages':       { label: 'Сообщения',   category: 'social',       color: '#ec4899' },
  'posts':          { label: 'Посты',       category: 'social',       color: '#ec4899' },
};

const CATEGORY_LABELS: Record<string, string> = {
  'personal':    '👤 Личные',
  'financial':   '💳 Финансовые',
  'educational': '📚 Образовательные',
  'behavioral':  '🧠 Поведенческие',
  'social':      '👥 Социальные',
};

const PROBLEM_NAMES: Record<string, string> = {
  breach: 'Утечка данных',
  broker: 'Продаёт данные',
  zombie: 'Забытый 2+ года',
  overreach: 'Избыточный доступ'
};

const PROBLEM_COLORS: Record<string, string> = {
  breach: '#ff3355',
  broker: '#a855f7',
  zombie: '#eab308',
  overreach: '#fb923c'
};

interface Node {
  name: string;
  problems?: string[];
  dataFields?: string[];
}

interface BreachInfo {
  breached: boolean;
  date?: string;
  records?: number;
  exposed?: string[];
}

interface Props {
  node: Node | null;
  onClose: () => void;
  onDelete: (node: Node) => void;
  breach?: BreachInfo | null;
}

export default function ServicePanel({ node, onClose, onDelete, breach }: Props) {
  if (!node) return null;

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '350px',
      height: '100vh',
      background: '#111',
      borderLeft: '1px solid #333',
      color: '#fff',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 20
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#888',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>

      <h2 style={{ margin: '0 0 20px 0' }}>{node.name}</h2>

      {(() => {
        const grouped: Record<string, string[]> = {};
        node.dataFields?.forEach(field => {
          const info = DATA_CATEGORIES[field];
          const cat = info?.category || 'personal';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(info?.label || field);
        });
        return Object.keys(grouped).length > 0 ? (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', color: '#888', margin: '0 0 10px 0' }}>
              Категории данных
            </h3>
            {Object.entries(grouped).map(([cat, fields]) => {
              const catColor = DATA_CATEGORIES[
                Object.keys(DATA_CATEGORIES).find(k => DATA_CATEGORIES[k].category === cat) || ''
              ]?.color || '#444';
              return (
                <div key={cat} style={{
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: '#1a1a1a',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${catColor}`
                }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {fields.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null;
      })()}

      {breach && breach.breached && (
        <div style={{
          background: '#ff335520',
          border: '1px solid #ff3355',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ color: '#ff3355', fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ Данный сервис был взломан
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            Дата утечки: {breach.date || 'Неизвестно'}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            Пострадало записей: {breach.records?.toLocaleString() || '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
            Утекли данные: {breach.exposed?.join(', ') || '—'}
          </div>
        </div>
      )}

      {node.problems && node.problems.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#888', margin: '0 0 10px 0' }}>
            Обнаруженные проблемы
          </h3>
          {node.problems.map((problem) => (
            <div
              key={problem}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: PROBLEM_COLORS[problem] ?? '#888',
                  marginRight: '10px'
                }}
              />
              <span>{PROBLEM_NAMES[problem] ?? problem}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#888', margin: '0 0 10px 0' }}>
          Ваши данные
        </h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          {node.dataFields && node.dataFields.length > 0
            ? node.dataFields.join(', ')
            : 'Не указаны'}
        </div>
      </div>

      <button
        onClick={() => onDelete(node)}
        style={{
          width: '100%',
          padding: '10px',
          background: '#ff3355',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        🗑️ Удалить мои данные
      </button>
    </div>
  );
}
