// ==UserScript==
// @name         stable diffusion webui提示词分组器
// @namespace    https://github.com/ragnaDolphin/stable_diffusion_webui_prompt_divider_-tampermonkey-/
// @version      2026-01-09
// @description  用来在sdwebui上附加N个提示词输入框，用来方便分别输入提示词（如风景、人物、衣服），输入后整合，手动放进原提示框中
// @author       ragnaDolphin
// @match        *://127.0.0.1:7860/*
// @match        *://localhost:7860/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 目标输入框的选择器（针对txt2img提示框；如果img2img，改为 '#img2img_prompt textarea'）
    const targetInputSelector = '#txt2img_prompt_row';

    // 默认输入框标题
    const defaultTitles = ['合并', '环境', '人物', '身体特征', '动作'];

    // 使用MutationObserver监视DOM变化
    const observer = new MutationObserver(function(mutations) {
        const targetInput = document.querySelector(targetInputSelector);
        if (targetInput && !targetInput.nextSibling?.textContent?.includes('添加输入框')) {  // 避免重复添加
            // 创建容器div来放置按钮们，便于管理
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '10px';

            // 创建标题输入框（小输入框）
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = 'title-input';
            titleInput.placeholder = '输入新输入框标题';
            titleInput.style.width = '150px';  // 小输入框宽度
            titleInput.style.padding = '5px';
            titleInput.style.backgroundColor = '#333';  // 暗色底
            titleInput.style.color = '#fff';

            // 创建按钮
            const addButton = document.createElement('button');
            addButton.textContent = '添加输入框';
            addButton.style.marginTop = '10px';
            addButton.style.display = 'block';  // 确保按钮可见
            addButton.style.border = '1px solid #ccc';
            addButton.style.padding = '5px 10px';
            addButton.style.backgroundColor = '#555';
            addButton.style.color = '#fff';

            // 创建"合并文本"按钮
            const mergeButton = document.createElement('button');
            mergeButton.id = 'merge-input-button';
            mergeButton.textContent = '合并文本';
            mergeButton.style.marginTop = '10px';
            mergeButton.style.border = '1px solid #ccc';  // 添加边框
            mergeButton.style.padding = '5px 10px';
            mergeButton.style.backgroundColor = '#555';
            mergeButton.style.color = '#fff';

            // 将按钮添加到容器
            buttonContainer.appendChild(titleInput);
            buttonContainer.appendChild(addButton);
            buttonContainer.appendChild(mergeButton);

            // 在目标输入框下方插入按钮容器
            targetInput.parentNode.insertBefore(buttonContainer, targetInput.nextSibling);

            // 创建可拖拽拉伸的输入框
            function createResizableInput(titleText) {
                // 创建容器div，用于包裹输入框和拖拽手柄
                const inputContainer = document.createElement('div');
                inputContainer.className = 'resizable-input-container';
                inputContainer.style.position = 'relative';
                inputContainer.style.marginTop = '10px';
                inputContainer.style.width = '100%';
                inputContainer.style.border = '1px solid #444';
                inputContainer.style.borderRadius = '5px';
                inputContainer.style.padding = '10px';
                inputContainer.style.backgroundColor = '#2a2a2a';

                // 创建标题元素（左上显示）
                const titleLabel = document.createElement('label');
                titleLabel.textContent = titleText;
                titleLabel.style.display = 'block';
                titleLabel.style.marginBottom = '5px';
                titleLabel.style.fontWeight = 'bold';
                titleLabel.style.color = '#ddd';  // 浅色文本以匹配暗主题

                // 创建删除按钮（右上角）
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '×';
                deleteButton.title = '删除此输入框';
                deleteButton.style.position = 'absolute';
                deleteButton.style.top = '5px';
                deleteButton.style.right = '5px';
                deleteButton.style.width = '20px';
                deleteButton.style.height = '20px';
                deleteButton.style.border = '1px solid #666';
                deleteButton.style.backgroundColor = '#444';
                deleteButton.style.color = '#fff';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.borderRadius = '50%';
                deleteButton.style.display = 'flex';
                deleteButton.style.alignItems = 'center';
                deleteButton.style.justifyContent = 'center';
                deleteButton.style.fontSize = '16px';
                deleteButton.style.lineHeight = '1';
                deleteButton.style.padding = '0';
                deleteButton.style.zIndex = '20';

                // 删除按钮悬停效果
                deleteButton.addEventListener('mouseenter', function() {
                    deleteButton.style.backgroundColor = '#ff4444';
                    deleteButton.style.borderColor = '#ff6666';
                });
                deleteButton.addEventListener('mouseleave', function() {
                    deleteButton.style.backgroundColor = '#444';
                    deleteButton.style.borderColor = '#666';
                });

                // 删除按钮点击事件
                deleteButton.addEventListener('click', function() {
                    if (confirm(`确定要删除"${titleText}"输入框吗？`)) {
                        inputContainer.remove();
                    }
                });

                // 创建文本输入框
                const newInput = document.createElement('textarea');
                newInput.className = 'new-input';  // 添加类以便识别
                newInput.placeholder = '输入提示词...';
                newInput.style.display = 'block';
                newInput.style.width = '100%';
                newInput.style.height = '80px';  // 默认高度
                newInput.style.minHeight = '50px';  // 最小高度
                newInput.style.minWidth = '200px';  // 最小宽度
                newInput.style.backgroundColor = '#333';  // 暗色底
                newInput.style.color = '#fff';  // 白色文本以匹配暗色底
                newInput.style.border = '1px solid #555';  // 可选：暗色边框
                newInput.style.padding = '8px';
                newInput.style.resize = 'none';  // 禁用默认的resize
                newInput.style.boxSizing = 'border-box';
                newInput.style.borderRadius = '3px';

                // 创建拖拽手柄（右下角）
                const dragHandle = document.createElement('div');
                dragHandle.className = 'drag-handle';
                dragHandle.style.position = 'absolute';
                dragHandle.style.right = '5px';
                dragHandle.style.bottom = '5px';
                dragHandle.style.width = '15px';
                dragHandle.style.height = '15px';
                dragHandle.style.backgroundColor = '#666';
                dragHandle.style.border = '1px solid #888';
                dragHandle.style.cursor = 'nwse-resize';
                dragHandle.style.zIndex = '10';
                dragHandle.style.opacity = '0.7';
                dragHandle.style.borderRadius = '2px';

                // 鼠标悬停时显示手柄
                newInput.addEventListener('mouseenter', function() {
                    dragHandle.style.opacity = '1';
                });
                newInput.addEventListener('mouseleave', function() {
                    dragHandle.style.opacity = '0.7';
                });

                // 拖拽功能实现
                let isDragging = false;
                let startY, startHeight;

                dragHandle.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    isDragging = true;
                    startY = e.clientY;
                    startHeight = parseInt(getComputedStyle(newInput).height, 10);

                    // 添加全局鼠标事件监听
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                });

                function handleMouseMove(e) {
                    if (!isDragging) return;

                    const deltaY = e.clientY - startY;

                    // 计算新的宽度和高度
                    let newHeight = startHeight + deltaY;

                    // 应用最小尺寸限制
                    newHeight = Math.max(newHeight, 50);

                    // 更新输入框尺寸
                    newInput.style.height = newHeight + 'px';

                    // 手柄会自动跟随，因为它是输入框的子元素
                }

                function handleMouseUp() {
                    isDragging = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }

                // 组装元素
                inputContainer.appendChild(titleLabel);
                inputContainer.appendChild(deleteButton);
                inputContainer.appendChild(newInput);
                inputContainer.appendChild(dragHandle);

                return {
                    container: inputContainer,
                    input: newInput,
                    title: titleLabel,
                    deleteButton: deleteButton,
                    dragHandle: dragHandle
                };
            }

            // 按钮点击事件：添加新的输入框
            addButton.addEventListener('click', function() {
                const titleText = titleInput.value.trim() || '无标题';  // 如果为空，使用默认"无标题"

                const resizableInput = createResizableInput(titleText);

                // 在按钮容器上方插入新输入框
                const container = buttonContainer.parentNode;
                container.insertBefore(resizableInput.container, buttonContainer);

                // 清空标题输入框
                titleInput.value = '';
            });

            // "合并文本"按钮点击事件：收集所有新输入框文本，合并并设置到原输入框
            mergeButton.addEventListener('click', function() {
                const newInputs = document.querySelectorAll('.new-input');
                const texts = Array.from(newInputs).map(input => input.value.trim()).filter(text => text !== '');
                if (texts.length > 0) {
                    const mergedText = texts.join('\n');  // 用换行符分隔合并
                    const firstNewInput = newInputs[0];  // 第一个新输入框
                    firstNewInput.value = (targetInput.value ? targetInput.value + '\n' : '') + mergedText;  // 追加到原输入框
                    firstNewInput.dispatchEvent(new Event('input'));  // 触发输入事件以更新WebUI
                }
            });

            // 页面加载后自动添加默认输入框
            setTimeout(() => {
                defaultTitles.forEach(title => {
                    const resizableInput = createResizableInput(title);

                    // 在按钮容器上方插入新输入框
                    const container = buttonContainer.parentNode;
                    container.insertBefore(resizableInput.container, buttonContainer);
                });
            }, 1000);  // 延迟1秒确保页面完全加载

            // 添加后可停止观察，或继续监视
            observer.disconnect();
        }
    });

    // 开始观察body下的子节点变化
    observer.observe(document.body, { childList: true, subtree: true });
})();
