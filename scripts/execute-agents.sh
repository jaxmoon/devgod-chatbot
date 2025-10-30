#!/bin/bash
# Agent Swarm Execution Script
# 챗봇 프로젝트의 AGENT_TASK들을 효율적으로 실행하는 스크립트

set -e

# 스크립트 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TASKS_DIR="$PROJECT_ROOT/docs/tasks"

# 라이브러리 로드
source "$SCRIPT_DIR/lib/logger.sh"
source "$SCRIPT_DIR/lib/task-parser.sh"

# 전역 변수
COMPLETED_AGENTS=()
FAILED_AGENTS=()
START_TIME=$(date +%s)

# 도움말 출력
show_help() {
    cat <<EOF
Usage: $0 [OPTIONS]

챗봇 프로젝트의 AGENT_TASK를 실행하는 스크립트입니다.

OPTIONS:
    --phase <N>         특정 Phase만 실행 (1-6)
    --agent <ID>        특정 Agent만 실행 (예: 01, 02, 03)
    --list              모든 테스크 목록 출력
    --plan              실행 계획 출력
    --dry-run           실제 실행 없이 계획만 출력
    --parallel          병렬 실행 강제 (주의: 의존성 무시)
    --sequential        순차 실행 강제
    --help              이 도움말 출력

EXAMPLES:
    # 전체 실행 (권장)
    $0

    # 특정 Phase 실행
    $0 --phase 2

    # 특정 Agent 실행
    $0 --agent 03

    # 실행 계획 확인
    $0 --plan

    # 테스크 목록 확인
    $0 --list

    # Dry run (실제 실행 없음)
    $0 --dry-run

EOF
}

# Agent 실행 함수 (실제로는 사용자가 Claude Code로 수동 실행해야 함)
execute_agent() {
    local agent_id="$1"
    local task_file="$2"
    local is_parallel="$3"

    local task_name=$(get_task_name "$task_file")
    local subagent_type=$(get_subagent_type "$agent_id")

    log_agent_start "$agent_id" "$task_name"

    local agent_start_time=$(date +%s)

    # 실제 실행 로직 (여기서는 사용자에게 안내만 제공)
    cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AGENT_$agent_id 실행 필요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 테스크: $task_name
📄 파일: $task_file
🔧 Subagent: $subagent_type

다음 명령을 Claude Code에서 실행하세요:

  "docs/tasks/AGENT_TASK_$(printf '%02d' $agent_id)_*.md 파일의
   내용을 읽고 $subagent_type agent로 테스크를 실행해주세요."

또는:

  Task tool을 사용하여 subagent_type="$subagent_type"로
  해당 테스크를 실행하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

    # 사용자 입력 대기
    echo -n "AGENT_$agent_id 실행이 완료되었습니까? (y/n/s=skip): "
    read -r response

    local agent_end_time=$(date +%s)
    local duration=$((agent_end_time - agent_start_time))

    case "$response" in
        [Yy]*)
            COMPLETED_AGENTS+=("$agent_id")
            log_agent_complete "$agent_id" "$duration"
            return 0
            ;;
        [Ss]*)
            log_warning "$agent_id" "실행을 건너뛰었습니다"
            return 0
            ;;
        *)
            FAILED_AGENTS+=("$agent_id")
            log_agent_failed "$agent_id" "사용자가 실패로 표시함"
            return 1
            ;;
    esac
}

# Phase 실행
execute_phase() {
    local phase="$1"
    local phase_name=$(get_phase_name "$phase")
    local is_parallel=$(is_phase_parallel "$phase")

    log_phase_start "$phase" "$phase_name" "$is_parallel"

    local phase_start_time=$(date +%s)
    local phase_success=true

    # Phase에 속한 테스크들 가져오기
    local task_files=($(get_phase_tasks "$TASKS_DIR" "$phase"))

    if [ ${#task_files[@]} -eq 0 ]; then
        log_error "00" "Phase $phase에 테스크가 없습니다"
        return 1
    fi

    # 순차 실행
    if [ "$is_parallel" = "false" ]; then
        for task_file in "${task_files[@]}"; do
            local agent_id=$(get_agent_id "$task_file")

            # 의존성 체크
            local completed_list=$(IFS=,; echo "${COMPLETED_AGENTS[*]}")
            local can_execute=$(check_dependencies_satisfied "$agent_id" "$completed_list")

            if [ "$can_execute" = "false" ]; then
                log_warning "$agent_id" "의존성이 충족되지 않았습니다"
                phase_success=false
                continue
            fi

            if ! execute_agent "$agent_id" "$task_file" "false"; then
                phase_success=false
                break
            fi
        done
    else
        # 병렬 실행 (사용자가 동시에 여러 테스크 실행)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔄 병렬 실행 Phase"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "다음 Agent들을 동시에 실행할 수 있습니다:"
        echo ""

        for task_file in "${task_files[@]}"; do
            local agent_id=$(get_agent_id "$task_file")
            local task_name=$(get_task_name "$task_file")
            local subagent_type=$(get_subagent_type "$agent_id")

            echo "  • AGENT_$agent_id: $task_name ($subagent_type)"
        done

        echo ""
        echo "Claude Code에서 다음과 같이 병렬 실행하세요:"
        echo ""
        echo "  \"다음 테스크들을 병렬로 실행해주세요:\""
        echo ""

        for task_file in "${task_files[@]}"; do
            local agent_id=$(get_agent_id "$task_file")
            local task_name=$(get_task_name "$task_file")

            echo "  - AGENT_$agent_id: $task_name"
        done

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        # 각 Agent 완료 확인
        for task_file in "${task_files[@]}"; do
            local agent_id=$(get_agent_id "$task_file")

            if ! execute_agent "$agent_id" "$task_file" "true"; then
                phase_success=false
            fi
        done
    fi

    local phase_end_time=$(date +%s)
    local phase_duration=$((phase_end_time - phase_start_time))

    if [ "$phase_success" = true ]; then
        log_phase_end "$phase" "success" "$phase_duration"
        return 0
    else
        log_phase_end "$phase" "failed" "$phase_duration"
        return 1
    fi
}

# 전체 실행
execute_all() {
    init_log

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  챗봇 프로젝트 Agent Swarm 실행"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    local total_phases=6
    local completed_phases=0
    local failed_phases=0

    for phase in {1..6}; do
        if execute_phase "$phase"; then
            ((completed_phases++))
        else
            ((failed_phases++))

            echo ""
            echo -n "Phase $phase가 실패했습니다. 계속 진행하시겠습니까? (y/n): "
            read -r continue_response

            if [[ ! "$continue_response" =~ ^[Yy]$ ]]; then
                log_error "00" "사용자가 실행을 중단했습니다"
                break
            fi
        fi

        # 진행률 표시
        log_progress $((completed_phases + failed_phases)) "$total_phases"
    done

    # 최종 리포트 생성
    local end_time=$(date +%s)
    local total_duration=$((end_time - START_TIME))
    local estimated_duration=$((9 * 24 * 3600))  # 9.5일 = 약 9일로 간소화

    generate_report "$total_phases" "$completed_phases" "$failed_phases" "$total_duration" "$estimated_duration"

    # 실패한 Agent 목록 출력
    if [ ${#FAILED_AGENTS[@]} -gt 0 ]; then
        echo ""
        echo "❌ 실패한 Agent 목록:"
        for agent_id in "${FAILED_AGENTS[@]}"; do
            echo "  - AGENT_$agent_id"
        done
    fi

    # 완료한 Agent 목록 출력
    if [ ${#COMPLETED_AGENTS[@]} -gt 0 ]; then
        echo ""
        echo "✅ 완료한 Agent 목록:"
        for agent_id in "${COMPLETED_AGENTS[@]}"; do
            echo "  - AGENT_$agent_id"
        done
    fi
}

# 메인 실행
main() {
    local mode="all"
    local phase_num=""
    local agent_id=""
    local dry_run=false

    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --phase)
                mode="phase"
                phase_num="$2"
                shift 2
                ;;
            --agent)
                mode="agent"
                agent_id="$2"
                shift 2
                ;;
            --list)
                print_tasks_table "$TASKS_DIR"
                exit 0
                ;;
            --plan)
                print_execution_plan "$TASKS_DIR"
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Dry run
    if [ "$dry_run" = true ]; then
        print_execution_plan "$TASKS_DIR"
        exit 0
    fi

    # 실행 모드에 따라 처리
    case "$mode" in
        "all")
            execute_all
            ;;
        "phase")
            if [ -z "$phase_num" ] || [ "$phase_num" -lt 1 ] || [ "$phase_num" -gt 6 ]; then
                echo "에러: Phase 번호는 1-6 사이여야 합니다"
                exit 1
            fi
            init_log
            execute_phase "$phase_num"
            ;;
        "agent")
            if [ -z "$agent_id" ]; then
                echo "에러: Agent ID를 지정해야 합니다"
                exit 1
            fi
            local task_file=$(find "$TASKS_DIR" -name "AGENT_TASK_$(printf '%02d' $agent_id)_*.md" | head -1)
            if [ -z "$task_file" ]; then
                echo "에러: AGENT_$agent_id를 찾을 수 없습니다"
                exit 1
            fi
            init_log
            execute_agent "$agent_id" "$task_file" "false"
            ;;
    esac
}

# 스크립트 실행
main "$@"
