import React, { useState, useCallback, useRef } from 'react';
import { ThemeMode } from './types';
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from './constants';
import MarkdownViewer from './components/MarkdownViewer';
import { generatePDF } from './utils/pdfGenerator';

const DEFAULT_MARKDOWN: string = `# 📄 全功能 Markdown 演示文档 #rec

## 二级标题 (H2 Header)   #rec
这是普通段落，包含一个 #rec 标记。我们可以使用 **加粗文本**，*斜体文本*，或者 ~~删除线~~。
你甚至可以添加 [超链接](https://google.com) 或者行内代码 \`const x = 42;\`。

### 三级标题 (H3 Header)
这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。

#### 四级标题 (H4 Header) 
这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。

##### 五级标题 (H5 Header) 
这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。这里是普通文本。这里的文本可能很长。

###### 六级标题 (H6 Header)

## 无序列表
- 项目 A #rec
- 项目 B
  - 子项目 B.1，这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。
  - 子项目 B.2
    - 更深层的项目 B.2.1
    - 更深层的项目 B.2.2：这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。这里测试长文本项目。

## 有序列表
1. 列表项目 #rec
2. 列表项目
3. 列表项目

## Quote
> **注意 #rec**
> 这是一个模拟的引用（quote）。在 Markdown 中通常通过引用块来实现。
> 它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。

## Callout
> [!NOTE] Callout示例
> 这是一个模拟的callout。在 Markdown 中通常通过引用块来实现。
> 它可以**跨越多行**，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。它可以跨越多行，并且包含其他格式。


## 代码块演示
\`\`\`javascript
function helloWorld() {
  console.log("你好，MarkPDF Pro!"); // 注意：代码块内的 #rec 不会被着色
  const app = "Markdown to PDF";
  // 测试长代码换行: 这是一个非常长非常长非常长的注释，用于测试自动换行。这是一个非常长非常长非常长的注释，用于测试自动换行。这是一个非常长非常长非常长的注释，用于测试自动换行。这是一个非常长非常长非常长的注释，用于测试自动换行。这是一个非常长非常长非常长的注释，用于测试自动换行。
  return true;
}
\`\`\`

## 表格展示
| 功能 | 状态 | 备注 |
| :--- | :---: | :--- |
| PDF 导出 | ✅ | 支持多页 |
| 特殊标签 | #rec | 自动高亮 |
| 标题书签 | ✅ | 侧边栏导航 |
| 多级标题 | H1-H6 | 尺寸递减 |

---

文档结束`;

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.DARK);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Extract filename without extension
    const nameWithoutExt = (file.name as string).replace(/\.[^/.]+$/, "");
    setUploadedFilename(nameWithoutExt);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setMarkdown(content);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    // Removed window.confirm to ensure the button action is immediate and reliable
    setMarkdown("");
    setUploadedFilename('document');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generatePDF('preview-container', theme, uploadedFilename);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const colors = theme === ThemeMode.DARK ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: theme === ThemeMode.DARK ? '#111827' : '#F8FAFC' }}>
      {/* Header / Toolbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3AA99F] rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg">
              <i className="fa-solid fa-file-pdf"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Markdown to PDF</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Convert Markdown to Interactive PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setTheme(ThemeMode.LIGHT)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === ThemeMode.LIGHT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fa-solid fa-sun mr-2"></i> Light
              </button>
              <button
                onClick={() => setTheme(ThemeMode.DARK)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === ThemeMode.DARK ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
              >
                <i className="fa-solid fa-moon mr-2"></i> Dark
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <i className="fa-solid fa-upload mr-2"></i> Upload MD
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".md"
              className="hidden"
            />

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-[#3AA99F] text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center shadow-lg shadow-[#3AA99F]/20"
            >
              {isGenerating ? (
                <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Generating...</>
              ) : (
                <><i className="fa-solid fa-download mr-2"></i> Download PDF</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className="flex flex-col h-[70vh] lg:h-[calc(100vh-12rem)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Markdown Editor</span>
              <button 
                onClick={handleClear}
                className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center cursor-pointer"
                title="Clear all text"
              >
                <i className="fa-solid fa-trash mr-1"></i> Clear
              </button>
            </div>
            <span className="text-xs text-slate-400">{markdown.length} characters</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3AA99F]/50 shadow-inner overflow-auto"
            placeholder="Type your markdown here..."
          />
        </div>

        {/* Preview Side */}
        <div className="flex flex-col h-[70vh] lg:h-[calc(100vh-12rem)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">PDF Preview</span>
            <span className="text-xs text-slate-400">Target PDF Format (A4)</span>
          </div>
          <div 
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden overflow-y-auto"
            style={{ backgroundColor: colors.bg }}
          >
            <div id="preview-container">
              <MarkdownViewer content={markdown} theme={theme} />
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-slate-500 text-sm">
        Built with Gemini API & React. All rendering happens client-side for privacy.
      </footer>
    </div>
  );
};

export default App;