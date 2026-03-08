import React, { useState, useEffect } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineMail, HiOutlineX } from 'react-icons/hi';
import { employeService } from '../api/employeService';
import { OrgNode } from '../types';

const collectAllEmails = (nodes: OrgNode[]): { id: number; nom: string; email: string }[] => {
  const result: { id: number; nom: string; email: string }[] = [];
  const traverse = (node: OrgNode) => {
    if (node.email) result.push({ id: node.id, nom: node.nom, email: node.email });
    node.children?.forEach(traverse);
  };
  nodes.forEach(traverse);
  return result;
};

const OrganigrammePage: React.FC = () => {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Map<number, { nom: string; email: string }>>(new Map());

  useEffect(() => {
    loadOrganigramme();
  }, []);

  const loadOrganigramme = async () => {
    try {
      const res = await employeService.getOrganigramme();
      setTree(res.data.data || []);
    } catch (err) {
      console.error('Erreur chargement organigramme:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number, nom: string, email: string) => {
    setSelectedEmails(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, { nom, email });
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = collectAllEmails(tree);
    setSelectedEmails(new Map(all.map(e => [e.id, { nom: e.nom, email: e.email }])));
  };

  const clearSelection = () => {
    setSelectedEmails(new Map());
  };

  const openMailto = () => {
    const emails = Array.from(selectedEmails.values()).map(e => e.email).join(',');
    window.location.href = `mailto:${emails}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Organigramme</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">Vue hiérarchique de l'organisation</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectedEmails.size === collectAllEmails(tree).length ? clearSelection : selectAll}
            className="px-3 py-1.5 rounded-lg text-theme-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {selectedEmails.size === collectAllEmails(tree).length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
      </div>

      {/* Barre d'actions pour les emails sélectionnés */}
      {selectedEmails.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
          <HiOutlineMail size={20} className="text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-theme-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedEmails.size} employé{selectedEmails.size > 1 ? 's' : ''} sélectionné{selectedEmails.size > 1 ? 's' : ''}
            </p>
            <p className="text-theme-xs text-blue-500 dark:text-blue-400 truncate">
              {Array.from(selectedEmails.values()).map(e => e.email).join(', ')}
            </p>
          </div>
          <button
            onClick={openMailto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-theme-xs font-medium hover:bg-blue-600 transition-colors"
            title="Envoyer un mail"
          >
            <HiOutlineMail size={14} />
            Envoyer un mail
          </button>
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-500 transition-colors"
            title="Effacer la sélection"
          >
            <HiOutlineX size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
      ) : tree.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Aucun employé trouvé</div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          {tree.map(node => (
            <OrgNodeCard key={node.id} node={node} level={0} selectedEmails={selectedEmails} onToggle={toggleSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgNodeCard: React.FC<{
  node: OrgNode;
  level: number;
  selectedEmails: Map<number, { nom: string; email: string }>;
  onToggle: (id: number, nom: string, email: string) => void;
}> = ({ node, level, selectedEmails, onToggle }) => {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedEmails.has(node.id);

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex items-center gap-3 py-2">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            {expanded ? <HiOutlineChevronDown size={16} /> : <HiOutlineChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-7" />
        )}

        <div
          onClick={() => node.email && onToggle(node.id, node.nom, node.email)}
          className={`flex items-center gap-3 p-3 rounded-xl border flex-1 transition-colors cursor-pointer ${
            isSelected
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/50'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-500/50'
          }`}
        >
          {/* Checkbox */}
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {node.imageUrl ? (
            <img src={`http://localhost:8080${node.imageUrl}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 flex items-center justify-center text-sm font-bold">
              {node.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-gray-200 truncate">{node.nom}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-theme-xs text-gray-400">{node.matricule}</span>
              {node.poste && <span className="text-theme-xs text-brand-500">• {node.poste}</span>}
              {node.departement && <span className="text-theme-xs text-gray-400">• {node.departement}</span>}
            </div>
          </div>
          <span className="text-theme-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px] hidden sm:block" title={node.email}>
            {node.email}
          </span>
          {hasChildren && (
            <span className="text-theme-xs bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full font-medium">
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <OrgNodeCard key={child.id} node={child} level={level + 1} selectedEmails={selectedEmails} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganigrammePage;
