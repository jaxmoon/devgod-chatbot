#!/bin/bash
# Task Parser for Agent Task Metadata
# AGENT_TASK 파일에서 메타데이터를 파싱하는 유틸리티

# 테스크 파일에서 Agent ID 추출
get_agent_id() {
    local task_file="$1"
    basename "$task_file" | sed -E 's/AGENT_TASK_0*([0-9]+)_.*/\1/'
}

# 테스크 이름 추출
get_task_name() {
    local task_file="$1"
    grep -m 1 "^# " "$task_file" | sed 's/^# //' | sed 's/AGENT_TASK_[0-9]*_//' | sed 's/_/ /g'
}

# 소요 시간 추출 (일 단위)
get_task_duration() {
    local task_file="$1"
    grep "소요 시간" "$task_file" | sed -E 's/.*소요 시간[*:]*\s*([0-9.]+)일.*/\1/' | head -1
}

# 의존성 추출
get_task_dependencies() {
    local task_file="$1"
    local deps=$(grep -i "의존성" "$task_file" | head -1)

    if echo "$deps" | grep -q "없음"; then
        echo ""
    else
        # AGENT_XX 패턴 추출
        echo "$deps" | grep -oE "AGENT_[0-9]+" | sed 's/AGENT_0*//' | tr '\n' ',' | sed 's/,$//'
    fi
}

# 병렬 실행 가능 여부 확인
can_run_parallel() {
    local agent_id="$1"

    # Phase별 병렬 실행 가능 그룹
    case "$agent_id" in
        "02"|"03")  # Phase 2
            echo "true"
            ;;
        "04"|"06")  # Phase 3
            echo "true"
            ;;
        "08"|"09")  # Phase 5
            echo "true"
            ;;
        *)
            echo "false"
            ;;
    esac
}

# Phase 번호 추출
get_phase_number() {
    local agent_id="$1"

    case "$agent_id" in
        "01")
            echo "1"
            ;;
        "02"|"03")
            echo "2"
            ;;
        "04"|"06")
            echo "3"
            ;;
        "05"|"07")
            echo "4"
            ;;
        "08"|"09")
            echo "5"
            ;;
        "10")
            echo "6"
            ;;
        *)
            echo "0"
            ;;
    esac
}

# Subagent 타입 결정
get_subagent_type() {
    local agent_id="$1"

    case "$agent_id" in
        "01")
            echo "devops-engineer"
            ;;
        "02")
            echo "fullstack-developer"
            ;;
        "03")
            echo "backend-developer"
            ;;
        "04")
            echo "frontend-developer"
            ;;
        "05")
            echo "fullstack-developer"
            ;;
        "06")
            echo "fullstack-developer"
            ;;
        "07")
            echo "backend-developer"
            ;;
        "08"|"09")
            echo "test-engineer"
            ;;
        "10")
            echo "performance-engineer"
            ;;
        *)
            echo "general-purpose"
            ;;
    esac
}

# 모든 테스크 파일 목록 가져오기
get_all_task_files() {
    local tasks_dir="$1"
    find "$tasks_dir" -name "AGENT_TASK_*.md" -not -name "*_00_*" | sort
}

# 특정 Phase의 테스크 파일들 가져오기
get_phase_tasks() {
    local tasks_dir="$1"
    local phase="$2"

    case "$phase" in
        "1")
            echo "$tasks_dir/AGENT_TASK_01_SETUP.md"
            ;;
        "2")
            echo "$tasks_dir/AGENT_TASK_02_TYPES.md"
            echo "$tasks_dir/AGENT_TASK_03_API.md"
            ;;
        "3")
            echo "$tasks_dir/AGENT_TASK_04_UI_COMPONENTS.md"
            echo "$tasks_dir/AGENT_TASK_06_STORAGE.md"
            ;;
        "4")
            echo "$tasks_dir/AGENT_TASK_05_CONTAINER.md"
            echo "$tasks_dir/AGENT_TASK_07_ERROR.md"
            ;;
        "5")
            echo "$tasks_dir/AGENT_TASK_08_UNIT_TESTS.md"
            echo "$tasks_dir/AGENT_TASK_09_E2E_TESTS.md"
            ;;
        "6")
            echo "$tasks_dir/AGENT_TASK_10_OPTIMIZATION.md"
            ;;
        *)
            echo ""
            ;;
    esac
}

# 테스크 메타데이터 출력 (JSON 형식)
print_task_metadata() {
    local task_file="$1"

    if [ ! -f "$task_file" ]; then
        echo "{\"error\": \"Task file not found: $task_file\"}"
        return 1
    fi

    local agent_id=$(get_agent_id "$task_file")
    local task_name=$(get_task_name "$task_file")
    local duration=$(get_task_duration "$task_file")
    local dependencies=$(get_task_dependencies "$task_file")
    local can_parallel=$(can_run_parallel "$agent_id")
    local phase=$(get_phase_number "$agent_id")
    local subagent=$(get_subagent_type "$agent_id")

    cat <<EOF
{
  "agent_id": "$agent_id",
  "task_name": "$task_name",
  "duration_days": $duration,
  "dependencies": "$dependencies",
  "can_run_parallel": $can_parallel,
  "phase": $phase,
  "subagent_type": "$subagent",
  "file_path": "$task_file"
}
EOF
}

# Phase 이름 가져오기
get_phase_name() {
    local phase="$1"

    case "$phase" in
        "1")
            echo "Foundation"
            ;;
        "2")
            echo "Core Foundation"
            ;;
        "3")
            echo "UI & Storage"
            ;;
        "4")
            echo "Integration"
            ;;
        "5")
            echo "Testing"
            ;;
        "6")
            echo "Optimization"
            ;;
        *)
            echo "Unknown"
            ;;
    esac
}

# Phase가 병렬 실행 가능한지 확인
is_phase_parallel() {
    local phase="$1"

    case "$phase" in
        "2"|"3"|"5")
            echo "true"
            ;;
        *)
            echo "false"
            ;;
    esac
}

# 의존성 체크 (특정 agent가 실행 가능한지)
check_dependencies_satisfied() {
    local agent_id="$1"
    local completed_agents="$2"  # 쉼표로 구분된 완료된 agent ID 목록

    local task_file=$(find docs/tasks -name "AGENT_TASK_$(printf '%02d' $agent_id)_*.md" | head -1)

    if [ -z "$task_file" ]; then
        echo "false"
        return 1
    fi

    local dependencies=$(get_task_dependencies "$task_file")

    # 의존성이 없으면 실행 가능
    if [ -z "$dependencies" ]; then
        echo "true"
        return 0
    fi

    # 모든 의존성이 완료되었는지 확인
    IFS=',' read -ra DEPS <<< "$dependencies"
    for dep in "${DEPS[@]}"; do
        if ! echo ",$completed_agents," | grep -q ",$dep,"; then
            echo "false"
            return 1
        fi
    done

    echo "true"
    return 0
}

# 테스크 정보를 테이블 형식으로 출력
print_tasks_table() {
    local tasks_dir="$1"

    echo "┌──────────┬─────────────────────────┬──────────┬──────────────┬──────────┬───────────────────────┐"
    echo "│ Agent ID │ Task Name               │ Duration │ Dependencies │ Parallel │ Subagent Type         │"
    echo "├──────────┼─────────────────────────┼──────────┼──────────────┼──────────┼───────────────────────┤"

    for task_file in $(get_all_task_files "$tasks_dir"); do
        local agent_id=$(get_agent_id "$task_file")
        local task_name=$(get_task_name "$task_file")
        local duration=$(get_task_duration "$task_file")
        local dependencies=$(get_task_dependencies "$task_file")
        local can_parallel=$(can_run_parallel "$agent_id")
        local subagent=$(get_subagent_type "$agent_id")

        # 의존성이 없으면 "None" 표시
        [ -z "$dependencies" ] && dependencies="None"

        # 병렬 실행 가능 여부 이모지로 표시
        [ "$can_parallel" = "true" ] && can_parallel="✓" || can_parallel="✗"

        # 테이블 행 출력 (고정 폭)
        printf "│ %-8s │ %-23s │ %8s │ %-12s │ %-8s │ %-21s │\n" \
            "AGENT_$agent_id" \
            "${task_name:0:23}" \
            "${duration}d" \
            "${dependencies:0:12}" \
            "$can_parallel" \
            "${subagent:0:21}"
    done

    echo "└──────────┴─────────────────────────┴──────────┴──────────────┴──────────┴───────────────────────┘"
}

# Phase별 실행 계획 출력
print_execution_plan() {
    local tasks_dir="$1"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Agent Swarm Execution Plan"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for phase in {1..6}; do
        local phase_name=$(get_phase_name "$phase")
        local is_parallel=$(is_phase_parallel "$phase")

        if [ "$is_parallel" = "true" ]; then
            echo "Phase $phase: $phase_name (병렬 실행)"
        else
            echo "Phase $phase: $phase_name (순차 실행)"
        fi

        for task_file in $(get_phase_tasks "$tasks_dir" "$phase"); do
            if [ -f "$task_file" ]; then
                local agent_id=$(get_agent_id "$task_file")
                local task_name=$(get_task_name "$task_file")
                local subagent=$(get_subagent_type "$agent_id")

                if [ "$is_parallel" = "true" ]; then
                    echo "  ├─ AGENT_$agent_id: $task_name ($subagent)"
                else
                    echo "  └─ AGENT_$agent_id: $task_name ($subagent)"
                fi
            fi
        done

        echo ""
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}
