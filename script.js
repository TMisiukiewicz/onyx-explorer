document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('file-upload');
    const onyxDataContainer = document.getElementById('onyx-data-container');
    const fileUploadLabel = document.querySelector('.file-upload-label');

    fileUpload.addEventListener('change', handleFileUpload);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            fileUploadLabel.textContent = 'Loading...';
            onyxDataContainer.innerHTML = '<div class="loading">Loading file...</div>';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const onyxData = JSON.parse(e.target.result);
                    renderOnyxData(onyxData, onyxDataContainer);
                    fileUploadLabel.textContent = file.name;
                } catch (error) {
                    onyxDataContainer.innerHTML = '<div class="error">Error parsing JSON file. Make sure it is a valid Onyx state export.</div>';
                    fileUploadLabel.textContent = 'Choose Onyx State File';
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.onerror = () => {
                onyxDataContainer.innerHTML = '<div class="error">Error reading file. Please try again.</div>';
                fileUploadLabel.textContent = 'Choose Onyx State File';
            };
            reader.readAsText(file);
        }
    }

    function makeCollapsible(buttonElement) {
        buttonElement.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('content')) {
                content.style.display = content.style.display === "block" ? "none" : "block";
            }
        });
    }

    function renderSingleItem(key, value, parentLiElement) {
        const isObject = typeof value === 'object' && value !== null;
        const isLegacyCollection = key.startsWith('collection_');
        let itemCountDisplay = '';

        if (isLegacyCollection && isObject) {
            const count = Array.isArray(value) ? value.length : Object.keys(value).length;
            itemCountDisplay = ` <span class="item-count">(${count} items)</span>`;
        } else if (Array.isArray(value)) {
            itemCountDisplay = ` <span class="item-count">[${value.length}]</span>`;
        } else if (isObject && !Array.isArray(value)) {
            itemCountDisplay = ` <span class="item-count">{${Object.keys(value).length}}</span>`;
        }

        if (isObject) {
            const button = document.createElement('button');
            button.classList.add('collapsible');
            button.innerHTML = `<span>${key}</span>${itemCountDisplay}`;
            parentLiElement.appendChild(button);

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('content');
            renderOnyxData(value, contentDiv);
            parentLiElement.appendChild(contentDiv);
            makeCollapsible(button);
        } else {
            const valueDisplay = typeof value === 'string' ? `"${value}"` : value;
            parentLiElement.innerHTML = `<span class="key">${key}:</span> <span class="value">${valueDisplay}</span>${itemCountDisplay}`;
        }
    }

    // --- COLLECTION PREFIXES ---
    const COLLECTION_PREFIXES = [
        'download_',
        'policy_',
        'policyDrafts_',
        'policyJoinMember_',
        'policyCategories_',
        'policyCategoriesDraft_',
        'policyRecentlyUsedCategories_',
        'policyTags_',
        'nvp_recentlyUsedTags_',
        'nvp_recentlyUsedDestinations_',
        'policyHasConnectionsDataBeenFetched_',
        'policyRecentlyUsedTags_',
        'policyConnectionSyncProgress_',
        'workspaceInviteMembersDraft_',
        'workspaceInviteMessageDraft_',
        'workspaceInviteRoleDraft_',
        'report_',
        'reportNameValuePairs_',
        'reportDraft_',
        'reportMetadata_',
        'reportActions_',
        'reportActionsDrafts_',
        'reportActionsPages_',
        'reportActionsReactions_',
        'reportDraftComment_',
        'reportIsComposerFullSize_',
        'reportUserIsTyping_',
        'reportUserIsLeavingRoom_',
        'reportViolations_',
        'securityGroup_',
        'transactions_',
        'transactionViolations_',
        'transactionsDraft_',
        'skipConfirmation_',
        'transactionsBackup_',
        'splitTransactionDraft_',
        'privateNotesDraft_',
        'reportNextStep_',
        'selectedTab_',
        'policyMemberList_',
        'snapshot_',
        'sharedNVP_private_billingGracePeriodEnd_',
        'sharedNVP_private_domain_member_',
        'cards_',
        'private_expensifyCardSettings_',
        'expensifyCardBankAccountMetadata_',
        'private_expensifyCardManualBilling_',
        'expensifyCard_continuousReconciliationConnection_',
        'expensifyCard_useContinuousReconciliation_',
        'lastSelectedFeed_',
        'lastSelectedExpensifyCardFeed_',
        'nvp_expensify_onCardWaitlist_',
        'nvp_expensify_report_PDFFilename_',
        'issueNewExpensifyCard_',
    ];
    function isCollectionKey(key) {
        return COLLECTION_PREFIXES.some(prefix => key.startsWith(prefix));
    }

    function getCollectionPrefix(key) {
        for (const prefix of COLLECTION_PREFIXES) {
            if (key.startsWith(prefix)) {
                return prefix;
            }
        }
        return null;
    }

    function groupCollectionsByPrefix(collections) {
        const groups = {};
        for (const key in collections) {
            const prefix = getCollectionPrefix(key);
            if (prefix) {
                if (!groups[prefix]) {
                    groups[prefix] = {};
                }
                groups[prefix][key] = collections[key];
            }
        }
        return groups;
    }

    function countItems(value) {
        if (Array.isArray(value)) {
            return {
                type: 'array',
                count: value.length
            };
        }
        if (typeof value === 'object' && value !== null) {
            return {
                type: 'object',
                count: Object.keys(value).length
            };
        }
        return {
            type: 'value',
            count: 1
        };
    }

    function renderOnyxData(data, parentElement) {
        parentElement.innerHTML = '';
        if (typeof data !== 'object' || data === null) {
            parentElement.textContent = String(data);
            return;
        }

        const collections = {};
        const otherItems = {};
        
        for (const key in data) {
            if (!data.hasOwnProperty(key)) continue;
            if (isCollectionKey(key)) {
                collections[key] = data[key];
            } else {
                otherItems[key] = data[key];
            }
        }

        const ul = document.createElement('ul');
        
        // Group and render collections
        const collectionGroups = groupCollectionsByPrefix(collections);
        const groupKeys = Object.keys(collectionGroups).sort();
        
        if (groupKeys.length > 0) {
            const groupLi = document.createElement('li');
            const groupButton = document.createElement('button');
            groupButton.classList.add('collapsible');
            groupButton.innerHTML = `<span>Collections</span> <span class="item-count">(${groupKeys.length} groups)</span>`;
            groupLi.appendChild(groupButton);
            
            const groupContentDiv = document.createElement('div');
            groupContentDiv.classList.add('content');
            const groupUl = document.createElement('ul');
            
            for (const prefix of groupKeys) {
                const groupItems = collectionGroups[prefix];
                const groupItemLi = document.createElement('li');
                const groupItemButton = document.createElement('button');
                groupItemButton.classList.add('collapsible');
                
                // Count total items in this group
                const groupStats = Object.values(groupItems).reduce((stats, value) => {
                    const { type, count } = countItems(value);
                    if (!stats[type]) {
                        stats[type] = 0;
                    }
                    stats[type] += count;
                    return stats;
                }, {});
                
                const statsText = Object.entries(groupStats)
                    .map(([type, count]) => {
                        switch (type) {
                            case 'array': return `${count} array elements`;
                            case 'object': return `${count} object properties`;
                            case 'value': return `${count} values`;
                        }
                    })
                    .join(', ');
                
                groupItemButton.innerHTML = `<span>${prefix}</span> <span class="item-count">(${Object.keys(groupItems).length} keys)</span>`;
                groupItemLi.appendChild(groupItemButton);
                
                const groupItemContentDiv = document.createElement('div');
                groupItemContentDiv.classList.add('content');
                const groupItemUl = document.createElement('ul');
                
                for (const itemKey in groupItems) {
                    const itemValue = groupItems[itemKey];
                    const itemLi = document.createElement('li');
                    renderSingleItem(itemKey, itemValue, itemLi);
                    groupItemUl.appendChild(itemLi);
                }
                
                groupItemContentDiv.appendChild(groupItemUl);
                groupItemLi.appendChild(groupItemContentDiv);
                makeCollapsible(groupItemButton);
                groupUl.appendChild(groupItemLi);
            }
            
            groupContentDiv.appendChild(groupUl);
            groupLi.appendChild(groupContentDiv);
            makeCollapsible(groupButton);
            ul.appendChild(groupLi);
        }

        // Render other items
        for (const key in otherItems) {
            const value = otherItems[key];
            const li = document.createElement('li');
            renderSingleItem(key, value, li);
            ul.appendChild(li);
        }

        parentElement.appendChild(ul);
    }
}); 