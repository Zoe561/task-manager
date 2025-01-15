// cypress/integration/task-manager.spec.js

describe('Task Manager Application', () => {
    beforeEach(() => {
        // 在每個測試前訪問應用
        cy.visit('http://localhost:8080');
        // 清除localStorage
        cy.clearLocalStorage();
    });

    it('should load the application', () => {
        cy.get('h1').should('contain', '任務管理器');
        cy.get('.task-form').should('exist');
        cy.get('#taskInput').should('exist');
        cy.get('#prioritySelect').should('exist');
    });

    it('should add a new task', () => {
        const taskText = '測試任務1';
        // 輸入任務文本
        cy.get('#taskInput').type(taskText);
        // 選擇優先級
        cy.get('#prioritySelect').select('high');
        // 提交表單
        cy.get('.task-form').submit();
        // 驗證任務是否被添加
        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-content').should('contain', taskText);
        cy.get('.task-priority').should('contain', '高');
    });

    it('should add multiple tasks with different priorities', () => {
        // 添加高優先級任務
        cy.get('#taskInput').type('高優先級任務');
        cy.get('#prioritySelect').select('high');
        cy.get('.task-form').submit();

        // 添加中優先級任務
        cy.get('#taskInput').type('中優先級任務');
        cy.get('#prioritySelect').select('medium');
        cy.get('.task-form').submit();

        // 添加低優先級任務
        cy.get('#taskInput').type('低優先級任務');
        cy.get('#prioritySelect').select('low');
        cy.get('.task-form').submit();

        // 驗證所有任務都被添加
        cy.get('.task-item').should('have.length', 3);
    });

    it('should mark task as completed', () => {
        // 添加任務
        cy.get('#taskInput').type('待完成任務');
        cy.get('.task-form').submit();

        // 點擊完成按鈕
        cy.get('.complete-btn').click();

        // 驗證任務已被標記為完成
        cy.get('.task-item').should('have.class', 'completed');
        cy.get('.complete-btn').should('contain', '取消完成');
    });

    it('should maintain delete button styles regardless of task completion status', () => {
        // 添加任務
        cy.get('#taskInput').type('待刪除任務');
        cy.get('.task-form').submit();

        // 獲取刪除按鈕的原始樣式
        cy.get('.delete-btn').then($btn => {
            const originalOpacity = window.getComputedStyle($btn[0]).opacity;
            const originalTextDecoration = window.getComputedStyle($btn[0]).textDecoration;

            // 完成任務
            cy.get('.complete-btn').click();

            // 驗證刪除按鈕的樣式保持不變
            cy.get('.delete-btn').should($newBtn => {
                const newStyle = window.getComputedStyle($newBtn[0]);
                expect(newStyle.opacity).to.equal('1');
                expect(newStyle.textDecoration).to.not.include('line-through');
            });
        });

        // 驗證刪除功能仍然正常
        cy.get('.delete-btn').click();
        cy.get('.task-item').should('have.length', 0);
    });

    it('should persist tasks after page reload', () => {
        // 添加任務
        cy.get('#taskInput').type('持久化測試任務');
        cy.get('.task-form').submit();

        // 重新加載頁面
        cy.reload();

        // 驗證任務仍然存在
        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-content').should('contain', '持久化測試任務');
    });

    it('should not add empty tasks', () => {
        // 嘗試提交空任務
        cy.get('#taskInput').type('  ');
        cy.get('.task-form').submit();

        // 驗證沒有任務被添加
        cy.get('.task-item').should('have.length', 0);
    });

    it('should sort tasks by priority and completion status', () => {
        // 添加多個不同優先級的任務
        cy.get('#taskInput').type('低優先級任務');
        cy.get('#prioritySelect').select('low');
        cy.get('.task-form').submit();

        cy.get('#taskInput').type('高優先級任務');
        cy.get('#prioritySelect').select('high');
        cy.get('.task-form').submit();

        cy.get('#taskInput').type('中優先級任務');
        cy.get('#prioritySelect').select('medium');
        cy.get('.task-form').submit();

        // 驗證排序順序（高 > 中 > 低）
        cy.get('.task-item').eq(0).should('contain', '高優先級任務');
        cy.get('.task-item').eq(1).should('contain', '中優先級任務');
        cy.get('.task-item').eq(2).should('contain', '低優先級任務');
    });

    it('should handle long task names with proper word wrap', () => {
        const longTaskName = 'A'.repeat(100);
        cy.get('#taskInput').type(longTaskName);
        cy.get('.task-form').submit();

        // 驗證任務存在且內容正確
        cy.get('.task-item').should('exist');
        cy.get('.task-content').should('contain', longTaskName);

        // 驗證文字會自動換行而不會溢出
        cy.get('.task-content').then($el => {
            const style = window.getComputedStyle($el[0]);
            const actualWordWrap = style.wordWrap;
            const actualOverflowWrap = style.overflowWrap;

            expect(
                style.wordWrap === 'break-word' || style.overflowWrap === 'break-word',
                `Expected either word-wrap or overflow-wrap to be 'break-word', but got word-wrap: '${actualWordWrap}' and overflow-wrap: '${actualOverflowWrap}'`
            ).to.be.true;
            expect(style.overflow).to.equal('visible');
        });

        // 驗證內容區域不會超出任務項的寬度
        cy.get('.task-content').then($content => {
            cy.get('.task-item').then($item => {
                expect($content[0].getBoundingClientRect().width)
                    .to.be.at.most($item[0].getBoundingClientRect().width);
            });
        });

        // 驗證任務內容的寬度是否正確限制在容器內
        cy.get('.task-content').should($el => {
            const computedStyle = window.getComputedStyle($el[0]);
            expect(computedStyle.width).not.to.equal('auto');
            expect(parseFloat(computedStyle.width)).to.be.greaterThan(0);
        });
    });
});