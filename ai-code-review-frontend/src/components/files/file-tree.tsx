// src/components/files/file-tree.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { ProjectFile } from '@/lib/types';

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: ProjectFile;
}

interface FileTreeProps {
  files: ProjectFile[];
  selectedFileId?: string;
  onSelectFile: (file: ProjectFile) => void;
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode = {
    name: 'root',
    path: '',
    isFolder: true,
    children: [],
  };

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existing = current.children.find((c) => c.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.children.push(existing);
      }

      current = existing;
    }
  }

  // Sort: folders first, then files alphabetically
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
    nodes.forEach((n) => sortNodes(n.children));
  }

  sortNodes(root.children);
  return root.children;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return <FileJson className="w-4 h-4 text-amber-400 flex-shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    case 'prisma':
      return <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    default:
      return <FileCode className="w-4 h-4 text-primary-400 flex-shrink-0" />;
  }
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedFileId?: string;
  onSelectFile: (file: ProjectFile) => void;
}

function TreeItem({ node, level, selectedFileId, onSelectFile }: TreeItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className="w-full text-left py-1.5 pr-2 rounded-md hover:bg-surface-hover/70 flex items-center space-x-1.5 text-xs text-gray-300 transition-colors group"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-primary-400" />
          ) : (
            <Folder className="w-4 h-4 text-primary-400/80" />
          )}
          <span className="font-medium truncate">{node.name}</span>
        </button>

        {isOpen && (
          <div className="space-y-0.5">
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                level={level + 1}
                selectedFileId={selectedFileId}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = node.file?.id === selectedFileId;

  return (
    <button
      onClick={() => node.file && onSelectFile(node.file)}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
      className={`w-full text-left py-1.5 pr-2 rounded-md flex items-center space-x-2 text-xs transition-colors ${
        isSelected
          ? 'bg-primary-600/20 text-white font-medium border-l-2 border-primary-500 rounded-l-none'
          : 'text-gray-400 hover:text-white hover:bg-surface-hover/50'
      }`}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ files, selectedFileId, onSelectFile }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-500">
        No files in this project.
      </div>
    );
  }

  return (
    <div className="py-2 space-y-0.5 select-none overflow-y-auto max-h-[600px]">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          level={0}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
